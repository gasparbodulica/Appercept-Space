import React from 'react';
import type { Icon as TablerIcon } from '@tabler/icons-react';
import {
  // General
  IconHome, IconStar, IconHeart, IconFlag, IconBookmark, IconPin, IconHash,
  IconBolt, IconRocket, IconFlame, IconAward, IconSparkles, IconInfinity, IconTarget,
  // People
  IconUser, IconUsers, IconUserCircle, IconUserCheck, IconUserPlus,
  IconCrown, IconId, IconMoodSmile, IconBriefcase,
  // Business
  IconBuilding, IconBuildingStore, IconBuildingFactory2,
  IconPresentation, IconTrendingUp, IconReport, IconArtboard,
  // Tasks
  IconCheckbox, IconCircleCheck, IconListCheck, IconList, IconLayoutKanban,
  IconClipboard, IconClipboardList, IconNotes, IconPencil, IconEdit,
  // Communication
  IconMail, IconMailOpened, IconMessage, IconMessage2, IconMessages,
  IconPhone, IconPhoneCall, IconSend, IconAt, IconBell,
  // Files & Data
  IconFolder, IconFolderOpen, IconFile, IconFileText, IconFiles,
  IconCloud, IconDatabase, IconServer, IconPackage, IconDownload,
  // Finance
  IconCurrencyEuro, IconCurrencyDollar, IconReceipt, IconWallet,
  IconCreditCard, IconCoin, IconArrowsExchange, IconScale, IconBuildingBank, IconReportMoney,
  // Analytics
  IconChartBar, IconChartLine, IconChartPie, IconChartDots,
  IconAnalyze, IconStack, IconGraph,
  // Calendar & Time
  IconCalendar, IconCalendarEvent, IconClock, IconClockHour4,
  IconAlarm, IconHistory, IconTimeline,
  // Security
  IconLock, IconLockOpen, IconShield, IconShieldCheck, IconKey, IconEye, IconFingerprint,
  // Creative & Media
  IconPalette, IconBrush, IconColorSwatch, IconPhoto, IconMusic,
  IconVideo, IconCamera, IconMicrophone,
  // Tech & Dev
  IconCode, IconTerminal2, IconBug, IconCpu, IconDeviceLaptop,
  IconGitBranch, IconApi,
  // World & Other
  IconGlobe, IconWorld, IconMapPin, IconPlant, IconSearch, IconSettings,
  IconLayoutGrid, IconLayoutList,
} from '@tabler/icons-react';

export type IconComponent = TablerIcon;

export const ICON_MAP: Record<string, IconComponent> = {
  // General
  IconHome, IconStar, IconHeart, IconFlag, IconBookmark, IconPin, IconHash,
  IconBolt, IconRocket, IconFlame, IconAward, IconSparkles, IconInfinity, IconTarget,
  // People
  IconUser, IconUsers, IconUserCircle, IconUserCheck, IconUserPlus,
  IconCrown, IconId, IconMoodSmile, IconBriefcase,
  // Business
  IconBuilding, IconBuildingStore, IconBuildingFactory2,
  IconPresentation, IconTrendingUp, IconReport, IconArtboard,
  // Tasks
  IconCheckbox, IconCircleCheck, IconListCheck, IconList, IconLayoutKanban,
  IconClipboard, IconClipboardList, IconNotes, IconPencil, IconEdit,
  // Communication
  IconMail, IconMailOpened, IconMessage, IconMessage2, IconMessages,
  IconPhone, IconPhoneCall, IconSend, IconAt, IconBell,
  // Files & Data
  IconFolder, IconFolderOpen, IconFile, IconFileText, IconFiles,
  IconCloud, IconDatabase, IconServer, IconPackage, IconDownload,
  // Finance
  IconCurrencyEuro, IconCurrencyDollar, IconReceipt, IconWallet,
  IconCreditCard, IconCoin, IconArrowsExchange, IconScale, IconBuildingBank, IconReportMoney,
  // Analytics
  IconChartBar, IconChartLine, IconChartPie, IconChartDots,
  IconAnalyze, IconStack, IconGraph,
  // Calendar & Time
  IconCalendar, IconCalendarEvent, IconClock, IconClockHour4,
  IconAlarm, IconHistory, IconTimeline,
  // Security
  IconLock, IconLockOpen, IconShield, IconShieldCheck, IconKey, IconEye, IconFingerprint,
  // Creative
  IconPalette, IconBrush, IconColorSwatch, IconPhoto, IconMusic,
  IconVideo, IconCamera, IconMicrophone,
  // Tech
  IconCode, IconTerminal2, IconBug, IconCpu, IconDeviceLaptop,
  IconGitBranch, IconApi,
  // Other
  IconGlobe, IconWorld, IconMapPin, IconPlant, IconSearch, IconSettings,
  IconLayoutGrid, IconLayoutList,
};

export const ICON_CATEGORIES: { label: string; icons: string[] }[] = [
  {
    label: 'General',
    icons: ['IconHome', 'IconStar', 'IconHeart', 'IconFlag', 'IconBookmark', 'IconPin',
      'IconHash', 'IconBolt', 'IconRocket', 'IconFlame', 'IconAward', 'IconSparkles',
      'IconInfinity', 'IconTarget'],
  },
  {
    label: 'People',
    icons: ['IconUser', 'IconUsers', 'IconUserCircle', 'IconUserCheck', 'IconUserPlus',
      'IconCrown', 'IconId', 'IconMoodSmile', 'IconBriefcase'],
  },
  {
    label: 'Business',
    icons: ['IconBuilding', 'IconBuildingStore', 'IconBuildingFactory2',
      'IconPresentation', 'IconTrendingUp', 'IconReport', 'IconArtboard'],
  },
  {
    label: 'Tasks',
    icons: ['IconCheckbox', 'IconCircleCheck', 'IconListCheck', 'IconList',
      'IconLayoutKanban', 'IconClipboard', 'IconClipboardList', 'IconNotes',
      'IconPencil', 'IconEdit'],
  },
  {
    label: 'Communication',
    icons: ['IconMail', 'IconMailOpened', 'IconMessage', 'IconMessage2', 'IconMessages',
      'IconPhone', 'IconPhoneCall', 'IconSend', 'IconAt', 'IconBell'],
  },
  {
    label: 'Files & Data',
    icons: ['IconFolder', 'IconFolderOpen', 'IconFile', 'IconFileText', 'IconFiles',
      'IconCloud', 'IconDatabase', 'IconServer', 'IconPackage', 'IconDownload'],
  },
  {
    label: 'Finance',
    icons: ['IconCurrencyEuro', 'IconCurrencyDollar', 'IconReceipt', 'IconWallet',
      'IconCreditCard', 'IconCoin'],
  },
  {
    label: 'Analytics',
    icons: ['IconChartBar', 'IconChartLine', 'IconChartPie', 'IconChartDots',
      'IconAnalyze', 'IconStack', 'IconGraph'],
  },
  {
    label: 'Calendar',
    icons: ['IconCalendar', 'IconCalendarEvent', 'IconClock', 'IconClockHour4',
      'IconAlarm', 'IconHistory', 'IconTimeline'],
  },
  {
    label: 'Security',
    icons: ['IconLock', 'IconLockOpen', 'IconShield', 'IconShieldCheck',
      'IconKey', 'IconEye', 'IconFingerprint'],
  },
  {
    label: 'Creative',
    icons: ['IconPalette', 'IconBrush', 'IconColorSwatch', 'IconPhoto',
      'IconMusic', 'IconVideo', 'IconCamera', 'IconMicrophone'],
  },
  {
    label: 'Tech',
    icons: ['IconCode', 'IconTerminal2', 'IconBug', 'IconCpu',
      'IconDeviceLaptop', 'IconGitBranch', 'IconApi'],
  },
  {
    label: 'Other',
    icons: ['IconGlobe', 'IconWorld', 'IconMapPin', 'IconPlant',
      'IconSearch', 'IconSettings', 'IconLayoutGrid', 'IconLayoutList'],
  },
];

export const PAGE_COLORS = [
  '#4f6fff', '#3ecf8e', '#a78bfa', '#2dd4bf',
  '#f472b6', '#fb923c', '#f5c518', '#ff5c5c',
  '#6b7280', '#60a5fa', '#34d399', '#e879f9',
];

export function PageIcon({
  name,
  size = 16,
  color,
  style,
}: {
  name: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}) {
  const Icon = ICON_MAP[name];
  if (!Icon) {
    // Fallback: render as text (handles any legacy emoji or unknown string)
    return <span style={{ fontSize: size * 0.85, lineHeight: 1, ...style }}>{name}</span>;
  }
  return <Icon size={size} color={color} style={style} />;
}
