import { redirect } from 'next/navigation';

// Redirect to dashboard with tools collection active
// The main tools collection is displayed in the MainCanvas via the nav system
export default function ToolsPage() {
    redirect('/');
}
