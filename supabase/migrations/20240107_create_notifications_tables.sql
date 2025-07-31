-- Create notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in (
    'like',
    'reaction',
    'comment',
    'mention',
    'poll_vote',
    'friend_date',
    'friend_roster',
    'friend_plan',
    'circle_invite',
    'circle_activity',
    'reminder',
    'achievement',
    'system'
  )),
  title text not null,
  body text not null,
  data jsonb default '{}',
  read boolean default false,
  created_at timestamp with time zone default now(),
  
  -- Index for user queries
  constraint notifications_user_id_idx foreign key (user_id) references public.users(id) on delete cascade
);

-- Create indexes
create index notifications_user_id_created_at_idx on public.notifications(user_id, created_at desc);
create index notifications_user_id_read_idx on public.notifications(user_id, read);

-- Create notification preferences table
create table if not exists public.notification_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  push_enabled boolean default true,
  email_enabled boolean default false,
  
  -- Notification type preferences
  likes_reactions boolean default true,
  comments boolean default true,
  mentions boolean default true,
  friend_activity boolean default true,
  circle_updates boolean default true,
  reminders boolean default true,
  achievements boolean default true,
  
  -- Quiet hours
  quiet_hours_enabled boolean default false,
  quiet_hours_start time,
  quiet_hours_end time,
  
  -- Other preferences
  sound_enabled boolean default true,
  vibration_enabled boolean default true,
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create push tokens table
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android', 'web')),
  device_id text,
  app_version text,
  os_version text,
  active boolean default true,
  last_used timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for push tokens
create index push_tokens_user_id_idx on public.push_tokens(user_id);
create index push_tokens_token_idx on public.push_tokens(token);

-- Enable RLS
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_tokens enable row level security;

-- RLS policies for notifications
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "System can insert notifications"
  on public.notifications for insert
  with check (true);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- RLS policies for notification preferences
create policy "Users can view their own preferences"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
  on public.notification_preferences for update
  using (auth.uid() = user_id);

-- RLS policies for push tokens
create policy "Users can view their own push tokens"
  on public.push_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert their own push tokens"
  on public.push_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own push tokens"
  on public.push_tokens for update
  using (auth.uid() = user_id);

create policy "Users can delete their own push tokens"
  on public.push_tokens for delete
  using (auth.uid() = user_id);

-- Function to create default notification preferences
create or replace function public.create_default_notification_preferences()
returns trigger as $$
begin
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create preferences when user is created
create trigger create_notification_preferences_on_user_create
  after insert on public.users
  for each row
  execute function public.create_default_notification_preferences();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_notification_preferences_updated_at
  before update on public.notification_preferences
  for each row
  execute function public.update_updated_at_column();

create trigger update_push_tokens_updated_at
  before update on public.push_tokens
  for each row
  execute function public.update_updated_at_column();