import { redirect } from "next/navigation";
import ScanPage from "@/features/access-control/components/scan/page";
import { getAccessStats, isPoolService } from "@/features/access-control/services/access.service";
import { getCurrentUser } from "@/features/auth/lib/session";
import { getActiveStaffByUser } from "@/features/employees/services/staff.service";

export default async function ScannerPage() {
	const user = await getCurrentUser();
	if (!user) redirect("/login?next=%2Fscanner");
	if (user.role !== "empleado") redirect(user.role === "admin" ? "/admin/metrics" : "/");
	const employee = await getActiveStaffByUser(user.id);
	if (!employee?.serviceActive) redirect("/login?error=employee-inactive");
	const [stats, isPool] = await Promise.all([getAccessStats(employee.id), isPoolService(employee.serviceId)]);
	return <ScanPage serviceName={employee.serviceName} isPoolService={isPool} stats={stats} />;
}
