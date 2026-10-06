import { createBrowserRouter } from "react-router"

import { AppLayout } from "@/layouts/app-layout"
import { navigation } from "@/config/navigation"
import { PublicOnly, RequireAuth } from "@/components/auth/require-auth"
import { LoginPage } from "@/pages/auth/login"
import { VerifyOtpPage } from "@/pages/auth/verify-otp"
import { ForgotPasswordPage } from "@/pages/auth/forgot-password"
import { VerifyResetPage } from "@/pages/auth/verify-reset"
import { ResetPasswordPage } from "@/pages/auth/reset-password"
import { AccountRecoveryPage } from "@/pages/auth/account-recovery"
import { DashboardPage } from "@/pages/dashboard"
import { AssetsPage } from "@/pages/assets/assets"
import { AssetOnboardingPage } from "@/pages/assets/asset-onboarding"
import { AssetDetailPage } from "@/pages/assets/asset-detail"
import { MyTasksPage } from "@/pages/my-tasks"
import { TaskPage } from "@/pages/task"
import { ComingSoonPage } from "@/pages/coming-soon"

/** Sidebar sections with a real screen; the rest render a placeholder */
const built = new Set(["/", "/assets", "/my-tasks", "/testing-measurements", "/maintenance-activities"])

/*
 * There is no Register screen: ELPREMAR accounts are created by OLIVINE in the
 * OCC console (ELPREMAR onboarding), never requested from the tablet.
 */
export const router = createBrowserRouter([
  { path: "/login", element: <PublicOnly><LoginPage /></PublicOnly> },
  { path: "/login/verify", element: <PublicOnly><VerifyOtpPage /></PublicOnly> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/forgot-password/verify", element: <VerifyResetPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/account-recovery", element: <AccountRecoveryPage /> },

  // The app itself, behind sign-in
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "assets", element: <AssetsPage /> },
          /* Onboarding sits above ":id" so the literal path is never read as an asset id */
          { path: "assets/onboarding", element: <AssetOnboardingPage /> },
          { path: "assets/:id", element: <AssetDetailPage /> },
          { path: "my-tasks", element: <MyTasksPage /> },
          { path: "my-tasks/:id", element: <TaskPage /> },
          // The two work queues are My Tasks narrowed to one kind of work
          { path: "testing-measurements", element: <MyTasksPage key="inspection" kind="inspection" title="Testing & Measurements" /> },
          { path: "maintenance-activities", element: <MyTasksPage key="maintenance" kind="maintenance" title="Maintenance Activities" /> },
          // Remaining sidebar entries show a placeholder until their screens are built
          ...navigation
            .filter((item) => !built.has(item.path))
            .map((item) => ({ path: item.path.slice(1), element: <ComingSoonPage title={item.title} /> })),
          { path: "*", element: <ComingSoonPage title="Page not found" /> },
        ],
      },
    ],
  },
])
