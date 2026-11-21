import { AdminNavigation } from "../components/AdminNavigation";
import "../../member4/Member4.css";

export default function AdminProfileLoading() {
  return <main className="memberPage">
    <AdminNavigation activePage="profile" />
    <div className="memberMain"><section className="surface" role="status">Loading profile…</section></div>
  </main>;
}
