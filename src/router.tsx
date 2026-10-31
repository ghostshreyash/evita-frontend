import { createBrowserRouter } from "react-router"

import { AppLayout } from "@/layouts/app-layout"
import { PublicOnly, RequireAuth } from "@/components/auth/require-auth"
import { LoginPage } from "@/pages/auth/login"
import { VerifyOtpPage } from "@/pages/auth/verify-otp"
import { NewPasswordPage } from "@/pages/auth/new-password"
import { ForgotPasswordPage } from "@/pages/auth/forgot-password"
import { VerifyResetPage } from "@/pages/auth/verify-reset"
import { ResetPasswordPage } from "@/pages/auth/reset-password"
import { AccountRecoveryPage } from "@/pages/auth/account-recovery"
import { DashboardPage } from "@/pages/dashboard"
import { AssetsPage } from "@/pages/assets/assets"
import { AssetOnboardingPage } from "@/pages/assets/asset-onboarding"
import { AssetDetailPage } from "@/pages/assets/asset-detail"
import { VisitPage } from "@/pages/visit"
import { ReportsPage } from "@/pages/reports"
import { ReportedIssuesPage } from "@/pages/reported-issues"
import { IssueDetailPage } from "@/pages/issue-detail"
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
  /* The temporary password OCC issued has to be replaced before Cognito will
     open a session, so this is on the path of every first sign-in */
  { path: "/login/new-password", element: <PublicOnly><NewPasswordPage /></PublicOnly> },
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
          /* A scheduled visit: the area, and the assets standing in it */
          { path: "visits/:id", element: <VisitPage /> },
          { path: "assets/:id", element: <AssetDetailPage /> },
          /* The same wizard, filled in with what the asset holds */
          { path: "assets/:id/edit", element: <AssetOnboardingPage /> },
          { path: "reports", element: <ReportsPage /> },
          /* What this engineer has reported, and what came back - see lib/issues */
          { path: "issues", element: <ReportedIssuesPage /> },
          { path: "issues/:id", element: <IssueDetailPage /> },
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
