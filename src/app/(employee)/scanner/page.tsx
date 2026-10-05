import ScanPage from "../../../features/access-control/components/scan/page";
import { getEmployeeAccessStats, listDemoEmployees, listDemoServices } from "@/shared/lib/demo-store";
import { getJsonCurrentUser } from "@/features/auth/lib/json-auth";
import { redirect } from "next/navigation";

export default async function ScannerPage() {
	const user = await getJsonCurrentUser();
	if (!user) redirect("/login?next=%2Fscanner");
	if (user.role !== "empleado") redirect(user.role === "admin" ? "/admin/metrics" : "/");
	const [services, employees] = await Promise.all([listDemoServices(), listDemoEmployees()]);
	const employee = employees.find((item) => item.email.toLowerCase() === user.email.toLowerCase() && item.isActive);
	if (!employee) redirect("/login?error=employee-inactive");
	const service = services.find((item) => item.id === employee.serviceId && item.isActive);
	if (!service) redirect("/login?error=employee-inactive");
	const stats = await getEmployeeAccessStats(employee.id);
	return <ScanPage service={service} stats={stats} />;
}
