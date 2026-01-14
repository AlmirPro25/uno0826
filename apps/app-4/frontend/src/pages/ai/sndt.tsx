/**
 * Redirect page for SNDT
 * Redirects to the main SNDT module
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SNDTRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sndt');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}
