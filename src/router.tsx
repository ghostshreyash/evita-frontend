import { createBrowserRouter } from "react-router"

import { AppLayout } from "@/layouts/app-layout"
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
import { ReportsPage } from "@/pages/reports"
import { MyTasksPage } from "@/pages/my-tasks"
import { MorePage } from "@/pages/more"
import { TaskPage } from "@/pages/task"
import { ComingSoonPage } from "@/pages/coming-soon"

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
          { path: "reports", element: <ReportsPage /> },
          { path: "my-tasks", element: <MyTasksPage /> },
          { path: "my-tasks/:id", element: <TaskPage /> },
          { path: "inspections", element: <MyTasksPage only="inspection" /> },
          /* The same screen, under the section the record belongs to - see `jobPath` */
          { path: "inspections/:id", element: <TaskPage /> },
          /* Reached from the avatar in the top bar, not from the tab bar */
          { path: "more", element: <MorePage /> },
          /*
           * Split out: the FAQ it reads is the client's whole sheet, which is
           * the largest data module in the app and is wanted on one screen.
           */
          { path: "contact", lazy: async () => ({ Component: (await import("@/pages/contact")).ContactPage }) },
          { path: "*", element: <ComingSoonPage title="Page not found" /> },
        ],
      },
    ],
  },
])
