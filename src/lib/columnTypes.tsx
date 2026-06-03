import React from 'react';
import { ColumnType, ColumnConfig } from './types';
import {
  IconLetterCase, IconHash, IconChevronDown, IconList, IconCircleDot,
  IconCalendar, IconUser, IconCheckbox, IconLink, IconMail, IconPhone,
  IconFlag, IconTag,
} from '@tabler/icons-react';

export interface ColumnTypeMeta {
  type: ColumnType;
  label: string;
  icon: React.ReactNode;
}

// The set of column/property types the editor exposes.
export const COLUMN_TYPES: ColumnTypeMeta[] = [
  { type: 'text',         label: 'Text',          icon: <IconLetterCase size={15} /> },
  { type: 'number',       label: 'Number',        icon: <IconHash size={15} /> },
  { type: 'select',       label: 'Select',        icon: <IconChevronDown size={15} /> },
  { type: 'multi_select', label: 'Multi-select',  icon: <IconList size={15} /> },
  { type: 'status',       label: 'Status',        icon: <IconCircleDot size={15} /> },
  { type: 'priority',     label: 'Priority',      icon: <IconFlag size={15} /> },
  { type: 'tags',         label: 'Tags',          icon: <IconTag size={15} /> },
  { type: 'date',         label: 'Date',          icon: <IconCalendar size={15} /> },
  { type: 'person',       label: 'Person',        icon: <IconUser size={15} /> },
  { type: 'checkbox',     label: 'Checkbox',      icon: <IconCheckbox size={15} /> },
  { type: 'url',          label: 'URL',           icon: <IconLink size={15} /> },
  { type: 'email',        label: 'Email',         icon: <IconMail size={15} /> },
  { type: 'phone',        label: 'Phone',         icon: <IconPhone size={15} /> },
];

export function getTypeMeta(type: ColumnType): ColumnTypeMeta {
  return COLUMN_TYPES.find((t) => t.type === type) ?? COLUMN_TYPES[0];
}

// Sensible default config when a column is created or switched to a type.
// `select`/`multi_select` get a few starter options so the cell dropdown
// is immediately usable.
export function defaultConfigForType(type: ColumnType): ColumnConfig {
  switch (type) {
    case 'select':
    case 'multi_select':
      return {
        options: [
          { id: `o-${Date.now()}-1`, label: 'Option 1', color: '#1c75bc' },
          { id: `o-${Date.now()}-2`, label: 'Option 2', color: '#2ee89a' },
          { id: `o-${Date.now()}-3`, label: 'Option 3', color: '#fb923c' },
        ],
      };
    case 'number':
      return {};
    default:
      return {};
  }
}
