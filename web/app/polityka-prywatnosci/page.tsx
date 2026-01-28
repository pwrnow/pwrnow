'use client';

import PrivacyPolicy from '@/markdown/privacy-policy.mdx';

export default function PrivacyPolicyPage() {
  return (
    <div className='prose prose-lg dark:prose-invert max-w-none'>
      <PrivacyPolicy />
    </div>
  );
}
