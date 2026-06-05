'use client';

import { useEffect } from 'react';

/**
 * Invisible component — previously auto-synced client company names into the
 * Companies DB. Now a no-op: Companies DB is reserved for Gašpar's own legal
 * entities only. Client companies are read directly from the Clients DB.
 */
export function ClientPortalSync() {
  useEffect(() => {
    return;
  }, []);

  return null;
}
