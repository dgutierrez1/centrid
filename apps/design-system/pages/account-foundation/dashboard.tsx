import Link from 'next/link';
import { DashboardScreen } from '../../components/AccountFoundation';

export default function DashboardPage() {
  return (
    <div>
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded">
        <Link href="/account-foundation" className="text-sm text-primary-600 hover:underline">
          ← Back to Account Foundation
        </Link>
      </div>
      <DashboardScreen />
    </div>
  );
}
