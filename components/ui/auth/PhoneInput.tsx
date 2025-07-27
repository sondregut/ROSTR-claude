import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface PhoneInputProps {
  label: string;
  value: string;
  onChangeText: (phone: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  onboardingStyle?: boolean; // New prop for onboarding styling
}

interface CountryCode {
  code: string;
  country: string;
  iso: string;
  flag: string;
  phoneLength?: { min: number; max: number }; // Optional for backwards compatibility
}

// Comprehensive country codes list with phone number lengths
const COUNTRY_CODES = [
  { code: '+93', country: 'Afghanistan', iso: 'AF', flag: '🇦🇫', phoneLength: { min: 9, max: 9 } },
  { code: '+355', country: 'Albania', iso: 'AL', flag: '🇦🇱', phoneLength: { min: 9, max: 9 } },
  { code: '+213', country: 'Algeria', iso: 'DZ', flag: '🇩🇿', phoneLength: { min: 9, max: 9 } },
  { code: '+1684', country: 'American Samoa', iso: 'AS', flag: '🇦🇸', phoneLength: { min: 10, max: 10 } },
  { code: '+376', country: 'Andorra', iso: 'AD', flag: '🇦🇩', phoneLength: { min: 6, max: 6 } },
  { code: '+244', country: 'Angola', iso: 'AO', flag: '🇦🇴', phoneLength: { min: 9, max: 9 } },
  { code: '+1264', country: 'Anguilla', iso: 'AI', flag: '🇦🇮', phoneLength: { min: 10, max: 10 } },
  { code: '+1268', country: 'Antigua and Barbuda', iso: 'AG', flag: '🇦🇬', phoneLength: { min: 10, max: 10 } },
  { code: '+54', country: 'Argentina', iso: 'AR', flag: '🇦🇷', phoneLength: { min: 10, max: 11 } },
  { code: '+374', country: 'Armenia', iso: 'AM', flag: '🇦🇲', phoneLength: { min: 8, max: 8 } },
  { code: '+297', country: 'Aruba', iso: 'AW', flag: '🇦🇼', phoneLength: { min: 7, max: 7 } },
  { code: '+61', country: 'Australia', iso: 'AU', flag: '🇦🇺', phoneLength: { min: 9, max: 9 } },
  { code: '+43', country: 'Austria', iso: 'AT', flag: '🇦🇹', phoneLength: { min: 10, max: 13 } },
  { code: '+994', country: 'Azerbaijan', iso: 'AZ', flag: '🇦🇿' },
  { code: '+1242', country: 'Bahamas', iso: 'BS', flag: '🇧🇸' },
  { code: '+973', country: 'Bahrain', iso: 'BH', flag: '🇧🇭' },
  { code: '+880', country: 'Bangladesh', iso: 'BD', flag: '🇧🇩' },
  { code: '+1246', country: 'Barbados', iso: 'BB', flag: '🇧🇧' },
  { code: '+375', country: 'Belarus', iso: 'BY', flag: '🇧🇾' },
  { code: '+32', country: 'Belgium', iso: 'BE', flag: '🇧🇪' },
  { code: '+501', country: 'Belize', iso: 'BZ', flag: '🇧🇿' },
  { code: '+229', country: 'Benin', iso: 'BJ', flag: '🇧🇯' },
  { code: '+1441', country: 'Bermuda', iso: 'BM', flag: '🇧🇲' },
  { code: '+975', country: 'Bhutan', iso: 'BT', flag: '🇧🇹' },
  { code: '+591', country: 'Bolivia', iso: 'BO', flag: '🇧🇴' },
  { code: '+387', country: 'Bosnia and Herzegovina', iso: 'BA', flag: '🇧🇦' },
  { code: '+267', country: 'Botswana', iso: 'BW', flag: '🇧🇼' },
  { code: '+55', country: 'Brazil', iso: 'BR', flag: '🇧🇷' },
  { code: '+1284', country: 'British Virgin Islands', iso: 'VG', flag: '🇻🇬' },
  { code: '+673', country: 'Brunei', iso: 'BN', flag: '🇧🇳' },
  { code: '+359', country: 'Bulgaria', iso: 'BG', flag: '🇧🇬' },
  { code: '+226', country: 'Burkina Faso', iso: 'BF', flag: '🇧🇫' },
  { code: '+257', country: 'Burundi', iso: 'BI', flag: '🇧🇮' },
  { code: '+855', country: 'Cambodia', iso: 'KH', flag: '🇰🇭' },
  { code: '+237', country: 'Cameroon', iso: 'CM', flag: '🇨🇲' },
  { code: '+1', country: 'Canada', iso: 'CA', flag: '🇨🇦', phoneLength: { min: 10, max: 10 } },
  { code: '+238', country: 'Cape Verde', iso: 'CV', flag: '🇨🇻' },
  { code: '+1345', country: 'Cayman Islands', iso: 'KY', flag: '🇰🇾' },
  { code: '+236', country: 'Central African Republic', iso: 'CF', flag: '🇨🇫' },
  { code: '+235', country: 'Chad', iso: 'TD', flag: '🇹🇩' },
  { code: '+56', country: 'Chile', iso: 'CL', flag: '🇨🇱' },
  { code: '+86', country: 'China', iso: 'CN', flag: '🇨🇳' },
  { code: '+57', country: 'Colombia', iso: 'CO', flag: '🇨🇴' },
  { code: '+269', country: 'Comoros', iso: 'KM', flag: '🇰🇲' },
  { code: '+243', country: 'Congo (DRC)', iso: 'CD', flag: '🇨🇩' },
  { code: '+242', country: 'Congo (Republic)', iso: 'CG', flag: '🇨🇬' },
  { code: '+682', country: 'Cook Islands', iso: 'CK', flag: '🇨🇰' },
  { code: '+506', country: 'Costa Rica', iso: 'CR', flag: '🇨🇷' },
  { code: '+225', country: 'Côte d\'Ivoire', iso: 'CI', flag: '🇨🇮' },
  { code: '+385', country: 'Croatia', iso: 'HR', flag: '🇭🇷' },
  { code: '+53', country: 'Cuba', iso: 'CU', flag: '🇨🇺' },
  { code: '+357', country: 'Cyprus', iso: 'CY', flag: '🇨🇾' },
  { code: '+420', country: 'Czech Republic', iso: 'CZ', flag: '🇨🇿' },
  { code: '+45', country: 'Denmark', iso: 'DK', flag: '🇩🇰' },
  { code: '+253', country: 'Djibouti', iso: 'DJ', flag: '🇩🇯' },
  { code: '+1767', country: 'Dominica', iso: 'DM', flag: '🇩🇲' },
  { code: '+1809', country: 'Dominican Republic', iso: 'DO', flag: '🇩🇴' },
  { code: '+593', country: 'Ecuador', iso: 'EC', flag: '🇪🇨' },
  { code: '+20', country: 'Egypt', iso: 'EG', flag: '🇪🇬' },
  { code: '+503', country: 'El Salvador', iso: 'SV', flag: '🇸🇻' },
  { code: '+240', country: 'Equatorial Guinea', iso: 'GQ', flag: '🇬🇶' },
  { code: '+291', country: 'Eritrea', iso: 'ER', flag: '🇪🇷' },
  { code: '+372', country: 'Estonia', iso: 'EE', flag: '🇪🇪' },
  { code: '+251', country: 'Ethiopia', iso: 'ET', flag: '🇪🇹' },
  { code: '+500', country: 'Falkland Islands', iso: 'FK', flag: '🇫🇰' },
  { code: '+298', country: 'Faroe Islands', iso: 'FO', flag: '🇫🇴' },
  { code: '+679', country: 'Fiji', iso: 'FJ', flag: '🇫🇯' },
  { code: '+358', country: 'Finland', iso: 'FI', flag: '🇫🇮' },
  { code: '+33', country: 'France', iso: 'FR', flag: '🇫🇷', phoneLength: { min: 10, max: 10 } },
  { code: '+594', country: 'French Guiana', iso: 'GF', flag: '🇬🇫' },
  { code: '+689', country: 'French Polynesia', iso: 'PF', flag: '🇵🇫' },
  { code: '+241', country: 'Gabon', iso: 'GA', flag: '🇬🇦' },
  { code: '+220', country: 'Gambia', iso: 'GM', flag: '🇬🇲' },
  { code: '+995', country: 'Georgia', iso: 'GE', flag: '🇬🇪' },
  { code: '+49', country: 'Germany', iso: 'DE', flag: '🇩🇪', phoneLength: { min: 11, max: 12 } },
  { code: '+233', country: 'Ghana', iso: 'GH', flag: '🇬🇭' },
  { code: '+350', country: 'Gibraltar', iso: 'GI', flag: '🇬🇮' },
  { code: '+30', country: 'Greece', iso: 'GR', flag: '🇬🇷' },
  { code: '+299', country: 'Greenland', iso: 'GL', flag: '🇬🇱' },
  { code: '+1473', country: 'Grenada', iso: 'GD', flag: '🇬🇩' },
  { code: '+590', country: 'Guadeloupe', iso: 'GP', flag: '🇬🇵' },
  { code: '+1671', country: 'Guam', iso: 'GU', flag: '🇬🇺' },
  { code: '+502', country: 'Guatemala', iso: 'GT', flag: '🇬🇹' },
  { code: '+224', country: 'Guinea', iso: 'GN', flag: '🇬🇳' },
  { code: '+245', country: 'Guinea-Bissau', iso: 'GW', flag: '🇬🇼' },
  { code: '+592', country: 'Guyana', iso: 'GY', flag: '🇬🇾' },
  { code: '+509', country: 'Haiti', iso: 'HT', flag: '🇭🇹' },
  { code: '+504', country: 'Honduras', iso: 'HN', flag: '🇭🇳' },
  { code: '+852', country: 'Hong Kong', iso: 'HK', flag: '🇭🇰' },
  { code: '+36', country: 'Hungary', iso: 'HU', flag: '🇭🇺' },
  { code: '+354', country: 'Iceland', iso: 'IS', flag: '🇮🇸' },
  { code: '+91', country: 'India', iso: 'IN', flag: '🇮🇳' },
  { code: '+62', country: 'Indonesia', iso: 'ID', flag: '🇮🇩' },
  { code: '+98', country: 'Iran', iso: 'IR', flag: '🇮🇷' },
  { code: '+964', country: 'Iraq', iso: 'IQ', flag: '🇮🇶' },
  { code: '+353', country: 'Ireland', iso: 'IE', flag: '🇮🇪' },
  { code: '+972', country: 'Israel', iso: 'IL', flag: '🇮🇱' },
  { code: '+39', country: 'Italy', iso: 'IT', flag: '🇮🇹' },
  { code: '+1876', country: 'Jamaica', iso: 'JM', flag: '🇯🇲' },
  { code: '+81', country: 'Japan', iso: 'JP', flag: '🇯🇵' },
  { code: '+962', country: 'Jordan', iso: 'JO', flag: '🇯🇴' },
  { code: '+7', country: 'Kazakhstan', iso: 'KZ', flag: '🇰🇿' },
  { code: '+254', country: 'Kenya', iso: 'KE', flag: '🇰🇪' },
  { code: '+686', country: 'Kiribati', iso: 'KI', flag: '🇰🇮' },
  { code: '+850', country: 'North Korea', iso: 'KP', flag: '🇰🇵' },
  { code: '+82', country: 'South Korea', iso: 'KR', flag: '🇰🇷' },
  { code: '+965', country: 'Kuwait', iso: 'KW', flag: '🇰🇼' },
  { code: '+996', country: 'Kyrgyzstan', iso: 'KG', flag: '🇰🇬' },
  { code: '+856', country: 'Laos', iso: 'LA', flag: '🇱🇦' },
  { code: '+371', country: 'Latvia', iso: 'LV', flag: '🇱🇻' },
  { code: '+961', country: 'Lebanon', iso: 'LB', flag: '🇱🇧' },
  { code: '+266', country: 'Lesotho', iso: 'LS', flag: '🇱🇸' },
  { code: '+231', country: 'Liberia', iso: 'LR', flag: '🇱🇷' },
  { code: '+218', country: 'Libya', iso: 'LY', flag: '🇱🇾' },
  { code: '+423', country: 'Liechtenstein', iso: 'LI', flag: '🇱🇮' },
  { code: '+370', country: 'Lithuania', iso: 'LT', flag: '🇱🇹' },
  { code: '+352', country: 'Luxembourg', iso: 'LU', flag: '🇱🇺' },
  { code: '+853', country: 'Macau', iso: 'MO', flag: '🇲🇴' },
  { code: '+389', country: 'Macedonia', iso: 'MK', flag: '🇲🇰' },
  { code: '+261', country: 'Madagascar', iso: 'MG', flag: '🇲🇬' },
  { code: '+265', country: 'Malawi', iso: 'MW', flag: '🇲🇼' },
  { code: '+60', country: 'Malaysia', iso: 'MY', flag: '🇲🇾' },
  { code: '+960', country: 'Maldives', iso: 'MV', flag: '🇲🇻' },
  { code: '+223', country: 'Mali', iso: 'ML', flag: '🇲🇱' },
  { code: '+356', country: 'Malta', iso: 'MT', flag: '🇲🇹' },
  { code: '+692', country: 'Marshall Islands', iso: 'MH', flag: '🇲🇭' },
  { code: '+596', country: 'Martinique', iso: 'MQ', flag: '🇲🇶' },
  { code: '+222', country: 'Mauritania', iso: 'MR', flag: '🇲🇷' },
  { code: '+230', country: 'Mauritius', iso: 'MU', flag: '🇲🇺' },
  { code: '+262', country: 'Mayotte', iso: 'YT', flag: '🇾🇹' },
  { code: '+52', country: 'Mexico', iso: 'MX', flag: '🇲🇽' },
  { code: '+691', country: 'Micronesia', iso: 'FM', flag: '🇫🇲' },
  { code: '+373', country: 'Moldova', iso: 'MD', flag: '🇲🇩' },
  { code: '+377', country: 'Monaco', iso: 'MC', flag: '🇲🇨' },
  { code: '+976', country: 'Mongolia', iso: 'MN', flag: '🇲🇳' },
  { code: '+382', country: 'Montenegro', iso: 'ME', flag: '🇲🇪' },
  { code: '+1664', country: 'Montserrat', iso: 'MS', flag: '🇲🇸' },
  { code: '+212', country: 'Morocco', iso: 'MA', flag: '🇲🇦' },
  { code: '+258', country: 'Mozambique', iso: 'MZ', flag: '🇲🇿' },
  { code: '+95', country: 'Myanmar', iso: 'MM', flag: '🇲🇲' },
  { code: '+264', country: 'Namibia', iso: 'NA', flag: '🇳🇦' },
  { code: '+674', country: 'Nauru', iso: 'NR', flag: '🇳🇷' },
  { code: '+977', country: 'Nepal', iso: 'NP', flag: '🇳🇵' },
  { code: '+31', country: 'Netherlands', iso: 'NL', flag: '🇳🇱' },
  { code: '+687', country: 'New Caledonia', iso: 'NC', flag: '🇳🇨' },
  { code: '+64', country: 'New Zealand', iso: 'NZ', flag: '🇳🇿' },
  { code: '+505', country: 'Nicaragua', iso: 'NI', flag: '🇳🇮' },
  { code: '+227', country: 'Niger', iso: 'NE', flag: '🇳🇪' },
  { code: '+234', country: 'Nigeria', iso: 'NG', flag: '🇳🇬' },
  { code: '+683', country: 'Niue', iso: 'NU', flag: '🇳🇺' },
  { code: '+672', country: 'Norfolk Island', iso: 'NF', flag: '🇳🇫' },
  { code: '+1670', country: 'Northern Mariana Islands', iso: 'MP', flag: '🇲🇵' },
  { code: '+47', country: 'Norway', iso: 'NO', flag: '🇳🇴', phoneLength: { min: 8, max: 8 } },
  { code: '+968', country: 'Oman', iso: 'OM', flag: '🇴🇲' },
  { code: '+92', country: 'Pakistan', iso: 'PK', flag: '🇵🇰' },
  { code: '+680', country: 'Palau', iso: 'PW', flag: '🇵🇼' },
  { code: '+970', country: 'Palestine', iso: 'PS', flag: '🇵🇸' },
  { code: '+507', country: 'Panama', iso: 'PA', flag: '🇵🇦' },
  { code: '+675', country: 'Papua New Guinea', iso: 'PG', flag: '🇵🇬' },
  { code: '+595', country: 'Paraguay', iso: 'PY', flag: '🇵🇾' },
  { code: '+51', country: 'Peru', iso: 'PE', flag: '🇵🇪' },
  { code: '+63', country: 'Philippines', iso: 'PH', flag: '🇵🇭' },
  { code: '+48', country: 'Poland', iso: 'PL', flag: '🇵🇱' },
  { code: '+351', country: 'Portugal', iso: 'PT', flag: '🇵🇹' },
  { code: '+1787', country: 'Puerto Rico', iso: 'PR', flag: '🇵🇷' },
  { code: '+974', country: 'Qatar', iso: 'QA', flag: '🇶🇦' },
  { code: '+262', country: 'Réunion', iso: 'RE', flag: '🇷🇪' },
  { code: '+40', country: 'Romania', iso: 'RO', flag: '🇷🇴' },
  { code: '+7', country: 'Russia', iso: 'RU', flag: '🇷🇺' },
  { code: '+250', country: 'Rwanda', iso: 'RW', flag: '🇷🇼' },
  { code: '+1869', country: 'Saint Kitts and Nevis', iso: 'KN', flag: '🇰🇳' },
  { code: '+1758', country: 'Saint Lucia', iso: 'LC', flag: '🇱🇨' },
  { code: '+1784', country: 'Saint Vincent and the Grenadines', iso: 'VC', flag: '🇻🇨' },
  { code: '+685', country: 'Samoa', iso: 'WS', flag: '🇼🇸' },
  { code: '+378', country: 'San Marino', iso: 'SM', flag: '🇸🇲' },
  { code: '+239', country: 'São Tomé and Príncipe', iso: 'ST', flag: '🇸🇹' },
  { code: '+966', country: 'Saudi Arabia', iso: 'SA', flag: '🇸🇦' },
  { code: '+221', country: 'Senegal', iso: 'SN', flag: '🇸🇳' },
  { code: '+381', country: 'Serbia', iso: 'RS', flag: '🇷🇸' },
  { code: '+248', country: 'Seychelles', iso: 'SC', flag: '🇸🇨' },
  { code: '+232', country: 'Sierra Leone', iso: 'SL', flag: '🇸🇱' },
  { code: '+65', country: 'Singapore', iso: 'SG', flag: '🇸🇬' },
  { code: '+421', country: 'Slovakia', iso: 'SK', flag: '🇸🇰' },
  { code: '+386', country: 'Slovenia', iso: 'SI', flag: '🇸🇮' },
  { code: '+677', country: 'Solomon Islands', iso: 'SB', flag: '🇸🇧' },
  { code: '+252', country: 'Somalia', iso: 'SO', flag: '🇸🇴' },
  { code: '+27', country: 'South Africa', iso: 'ZA', flag: '🇿🇦' },
  { code: '+34', country: 'Spain', iso: 'ES', flag: '🇪🇸' },
  { code: '+94', country: 'Sri Lanka', iso: 'LK', flag: '🇱🇰' },
  { code: '+249', country: 'Sudan', iso: 'SD', flag: '🇸🇩' },
  { code: '+597', country: 'Suriname', iso: 'SR', flag: '🇸🇷' },
  { code: '+268', country: 'Swaziland', iso: 'SZ', flag: '🇸🇿' },
  { code: '+46', country: 'Sweden', iso: 'SE', flag: '🇸🇪' },
  { code: '+41', country: 'Switzerland', iso: 'CH', flag: '🇨🇭' },
  { code: '+963', country: 'Syria', iso: 'SY', flag: '🇸🇾' },
  { code: '+886', country: 'Taiwan', iso: 'TW', flag: '🇹🇼' },
  { code: '+992', country: 'Tajikistan', iso: 'TJ', flag: '🇹🇯' },
  { code: '+255', country: 'Tanzania', iso: 'TZ', flag: '🇹🇿' },
  { code: '+66', country: 'Thailand', iso: 'TH', flag: '🇹🇭' },
  { code: '+670', country: 'Timor-Leste', iso: 'TL', flag: '🇹🇱' },
  { code: '+228', country: 'Togo', iso: 'TG', flag: '🇹🇬' },
  { code: '+690', country: 'Tokelau', iso: 'TK', flag: '🇹🇰' },
  { code: '+676', country: 'Tonga', iso: 'TO', flag: '🇹🇴' },
  { code: '+1868', country: 'Trinidad and Tobago', iso: 'TT', flag: '🇹🇹' },
  { code: '+216', country: 'Tunisia', iso: 'TN', flag: '🇹🇳' },
  { code: '+90', country: 'Turkey', iso: 'TR', flag: '🇹🇷' },
  { code: '+993', country: 'Turkmenistan', iso: 'TM', flag: '🇹🇲' },
  { code: '+1649', country: 'Turks and Caicos Islands', iso: 'TC', flag: '🇹🇨' },
  { code: '+688', country: 'Tuvalu', iso: 'TV', flag: '🇹🇻' },
  { code: '+256', country: 'Uganda', iso: 'UG', flag: '🇺🇬' },
  { code: '+380', country: 'Ukraine', iso: 'UA', flag: '🇺🇦' },
  { code: '+971', country: 'United Arab Emirates', iso: 'AE', flag: '🇦🇪' },
  { code: '+44', country: 'United Kingdom', iso: 'GB', flag: '🇬🇧', phoneLength: { min: 10, max: 10 } },
  { code: '+1', country: 'United States', iso: 'US', flag: '🇺🇸', phoneLength: { min: 10, max: 10 } },
  { code: '+598', country: 'Uruguay', iso: 'UY', flag: '🇺🇾' },
  { code: '+998', country: 'Uzbekistan', iso: 'UZ', flag: '🇺🇿' },
  { code: '+678', country: 'Vanuatu', iso: 'VU', flag: '🇻🇺' },
  { code: '+379', country: 'Vatican City', iso: 'VA', flag: '🇻🇦' },
  { code: '+58', country: 'Venezuela', iso: 'VE', flag: '🇻🇪' },
  { code: '+84', country: 'Vietnam', iso: 'VN', flag: '🇻🇳' },
  { code: '+1284', country: 'Virgin Islands (British)', iso: 'VG', flag: '🇻🇬' },
  { code: '+1340', country: 'Virgin Islands (US)', iso: 'VI', flag: '🇻🇮' },
  { code: '+681', country: 'Wallis and Futuna', iso: 'WF', flag: '🇼🇫' },
  { code: '+212', country: 'Western Sahara', iso: 'EH', flag: '🇪🇭' },
  { code: '+967', country: 'Yemen', iso: 'YE', flag: '🇾🇪' },
  { code: '+260', country: 'Zambia', iso: 'ZM', flag: '🇿🇲' },
  { code: '+263', country: 'Zimbabwe', iso: 'ZW', flag: '🇿🇼' },
].sort((a, b) => a.country.localeCompare(b.country));

// Helper function to extract local number from full international number
const extractLocalNumber = (fullNumber: string, countries: CountryCode[]) => {
  if (!fullNumber.startsWith('+')) {
    return { country: countries.find(c => c.iso === 'US') || countries[0], localNumber: fullNumber.replace(/\D/g, '') };
  }

  // Find matching country by testing longest codes first
  for (const country of countries) {
    if (fullNumber.startsWith(country.code)) {
      const localNumber = fullNumber.substring(country.code.length).replace(/\D/g, '');
      return { country, localNumber };
    }
  }

  // Fallback to US if no match found
  return { country: countries.find(c => c.iso === 'US') || countries[0], localNumber: fullNumber.replace(/\D/g, '') };
};

// Enhanced formatting function for different countries
const formatLocalNumber = (digits: string, countryCode: string): string => {
  if (!digits) return '';

  switch (countryCode) {
    case '+1': // US/Canada
      if (digits.length >= 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
      } else if (digits.length >= 6) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      } else if (digits.length >= 3) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      }
      return digits;

    case '+44': // UK
      if (digits.length >= 10) {
        return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
      } else if (digits.length >= 7) {
        return `${digits.slice(0, 4)} ${digits.slice(4)}`;
      }
      return digits;

    case '+33': // France
      if (digits.length >= 10) {
        return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
      }
      return digits;

    case '+49': // Germany
      if (digits.length >= 11) {
        return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
      }
      return digits;

    case '+47': // Norway
      if (digits.length >= 8) {
        return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
      }
      return digits;

    default:
      // Default formatting: add spaces every 3-4 digits
      if (digits.length >= 6) {
        return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3');
      } else if (digits.length >= 3) {
        return digits.replace(/(\d{3})(\d+)/, '$1 $2');
      }
      return digits;
  }
};

export function PhoneInput({
  label,
  value,
  onChangeText,
  error,
  placeholder = "Enter your phone number",
  required = false,
  onboardingStyle = false,
}: PhoneInputProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRY_CODES.find(c => c.iso === 'US') || COUNTRY_CODES[0]
  );
  const [localNumber, setLocalNumber] = useState(''); // Store raw digits only
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sort countries by code length (longest first) to avoid substring matching issues
  const sortedCountries = useMemo(() => {
    return [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  }, []);

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRY_CODES;
    
    const query = searchQuery.toLowerCase();
    return COUNTRY_CODES.filter(country => 
      country.country.toLowerCase().includes(query) ||
      country.code.includes(query) ||
      country.iso.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Initialize local number from value prop when component mounts or value changes
  React.useEffect(() => {
    if (value && !localNumber) {
      const extractedLocal = extractLocalNumber(value, sortedCountries);
      if (extractedLocal.localNumber) {
        setSelectedCountry(extractedLocal.country);
        setLocalNumber(extractedLocal.localNumber);
      }
    }
  }, [value, localNumber, sortedCountries]);

  const handlePhoneChange = (input: string) => {
    // Extract only digits from input
    const digits = input.replace(/\D/g, '');
    
    // Update local number state
    setLocalNumber(digits);
    
    // Create full international number
    const fullNumber = selectedCountry.code + digits;
    
    // Call parent's onChange with full international number
    onChangeText(fullNumber);
  };

  const getDisplayValue = () => {
    return formatLocalNumber(localNumber, selectedCountry.code);
  };

  const toggleCountryPicker = () => {
    setShowCountryPicker(!showCountryPicker);
    setSearchQuery(''); // Clear search when opening
  };

  const selectCountry = (country: typeof COUNTRY_CODES[0]) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    setSearchQuery(''); // Clear search when closing
    
    // Update the phone number with new country code while keeping local number
    const fullNumber = country.code + localNumber;
    onChangeText(fullNumber);
  };

  const closeCountryPicker = () => {
    setShowCountryPicker(false);
    setSearchQuery('');
  };

  // Get placeholder text based on country
  const getPlaceholderText = (): string => {
    if (!selectedCountry.phoneLength) {
      return placeholder;
    }
    
    if (selectedCountry.phoneLength.min === selectedCountry.phoneLength.max) {
      return `${selectedCountry.phoneLength.min} digits`;
    } else {
      return `${selectedCountry.phoneLength.min}-${selectedCountry.phoneLength.max} digits`;
    }
  };

  // Define onboarding styles
  const onboardingInputStyles = onboardingStyle ? {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
  } : {
    backgroundColor: colors.card,
    borderColor: error ? colors.error : colors.border,
  };

  const onboardingTextStyles = onboardingStyle ? {
    color: 'white',
  } : {
    color: colors.text,
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, onboardingTextStyles]}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}
      
      <View style={[
        styles.inputContainer,
        onboardingInputStyles
      ]}>
        {/* Country Code Selector */}
        <Pressable
          style={[
            styles.countrySelector, 
            { 
              borderColor: onboardingStyle ? 'rgba(255, 255, 255, 0.2)' : colors.border
            }
          ]}
          onPress={toggleCountryPicker}
        >
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <Text style={[styles.countryCode, onboardingTextStyles]}>
            {selectedCountry.code}
          </Text>
          <Ionicons 
            name="chevron-down" 
            size={16} 
            color={onboardingStyle ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary}
          />
        </Pressable>
        
        {/* Phone Number Input */}
        <TextInput
          style={[styles.phoneInput, onboardingTextStyles]}
          value={getDisplayValue()}
          onChangeText={handlePhoneChange}
          placeholder={getPlaceholderText()}
          placeholderTextColor={onboardingStyle ? 'rgba(255, 255, 255, 0.5)' : colors.textSecondary}
          keyboardType="phone-pad"
          autoComplete="tel"
        />
      </View>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={closeCountryPicker}
      >
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <SafeAreaView 
                style={[styles.modalContent, { backgroundColor: colors.background }]}
                edges={['top', 'bottom']}
              >
                {/* Modal Header */}
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Select Country
                  </Text>
                  <Pressable
                    onPress={closeCountryPicker}
                    style={({ pressed }) => [
                      styles.closeButton,
                      pressed && styles.pressed
                    ]}
                    accessibilityLabel="Close"
                    accessibilityRole="button"
                  >
                    <Ionicons name="close" size={24} color={colors.text} />
                  </Pressable>
                </View>

                {/* Search Input */}
                <View style={styles.searchContainer}>
                  <View style={[styles.searchInputContainer, { 
                    backgroundColor: colors.card,
                    borderColor: colors.border 
                  }]}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.searchInput, { color: colors.text }]}
                      placeholder="Search countries..."
                      placeholderTextColor={colors.textSecondary}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Countries List */}
                <FlatList
                  data={filteredCountries}
                  keyExtractor={(item, index) => `${item.code}-${item.iso}-${index}`}
                  renderItem={({ item }) => (
                    <Pressable
                      style={({ pressed }) => [
                        styles.countryOption,
                        {
                          backgroundColor: selectedCountry.iso === item.iso 
                            ? colors.primary + '20' 
                            : pressed 
                            ? colors.border 
                            : 'transparent'
                        }
                      ]}
                      onPress={() => selectCountry(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${item.country} ${item.code}`}
                    >
                      <Text style={styles.flag}>{item.flag}</Text>
                      <View style={styles.countryInfo}>
                        <Text style={[styles.countryName, { color: colors.text }]}>
                          {item.country}
                        </Text>
                        <Text style={[styles.countryIso, { color: colors.textSecondary }]}>
                          {item.iso}
                        </Text>
                      </View>
                      <Text style={[styles.countryCodeList, { color: colors.textSecondary }]}>
                        {item.code}
                      </Text>
                      {selectedCountry.iso === item.iso && (
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      )}
                    </Pressable>
                  )}
                  contentContainerStyle={styles.listContainer}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                />
              </SafeAreaView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      
      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 48,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    gap: 6,
  },
  flag: {
    fontSize: 18,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '500',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    flex: 1,
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
  },
  pressed: {
    opacity: 0.7,
  },
  // Search styles
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  // List styles
  listContainer: {
    paddingBottom: 20,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  countryIso: {
    fontSize: 12,
    fontWeight: '400',
  },
  countryCodeList: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  error: {
    fontSize: 14,
    marginTop: 6,
    fontWeight: '500',
  },
});

// Export validation function for use in other components
export const validatePhoneForCountry = (phone: string): boolean => {
  if (!phone) return false;
  
  // Sort countries by code length (longest first) to avoid substring issues
  const sortedCountries = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  
  // Find the country based on the phone number
  let matchingCountry: CountryCode | undefined;
  for (const country of sortedCountries) {
    if (phone.startsWith(country.code)) {
      matchingCountry = country;
      break;
    }
  }
  
  if (!matchingCountry) {
    // Fallback: accept 7-15 digits for unknown countries
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  }
  
  // Extract local number by removing country code
  const countryCodeDigits = matchingCountry.code.substring(1); // Remove '+'
  const allDigits = phone.replace(/\D/g, '');
  const localDigits = allDigits.substring(countryCodeDigits.length);
  
  if (!matchingCountry.phoneLength) {
    // Fallback for countries without specific rules
    return localDigits.length >= 7 && localDigits.length <= 15;
  }
  
  return localDigits.length >= matchingCountry.phoneLength.min && 
         localDigits.length <= matchingCountry.phoneLength.max;
};