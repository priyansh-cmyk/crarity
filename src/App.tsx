import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";

import RolesNew from "./pages/RolesNew";
import Roles from "./pages/Roles";
import Settings from "./pages/Settings";
import Candidates from "./pages/Candidates";
import CandidateDetail from "./pages/CandidateDetail";
import Interviews from "./pages/Interviews";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";
import AcademicCounselorAssessment from "./pages/AcademicCounselorAssessment";
import AcademicCounselorAbout from "./pages/AcademicCounselorAbout";
import AcademicCounselorStart from "./pages/AcademicCounselorStart";
import MobileBlockGate from "./components/MobileBlockGate";
import AcademicCounselorGame1 from "./pages/AcademicCounselorGame1";
import AcademicCounselorGame2 from "./pages/AcademicCounselorGame2";
import AcademicCounselorGame3 from "./pages/AcademicCounselorGame3";
import AcademicCounselorGame4 from "./pages/AcademicCounselorGame4";
import AcademicCounselorResults from "./pages/AcademicCounselorResults";
import AcademicCounselorFilter1 from "./pages/AcademicCounselorFilter1";
import AcademicCounselorFilter2 from "./pages/AcademicCounselorFilter2";
import AcademicCounselorFilter3 from "./pages/AcademicCounselorFilter3";
import AcademicCounselorProfile from "./pages/AcademicCounselorProfile";
import CandidateSignup from "./pages/CandidateSignup";
import CandidateLogin from "./pages/CandidateLogin";
import CandidateDashboard from "./pages/CandidateDashboard";
import CandidateProfile from "./pages/CandidateProfile";
import CandidateSettings from "./pages/CandidateSettings";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminCandidates from "./pages/admin/AdminCandidates";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminCandidateDetail from "./pages/admin/AdminCandidateDetail";
import AdminEmployers from "./pages/admin/AdminEmployers";
import AdminEmployerDetail from "./pages/admin/AdminEmployerDetail";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminScores from "./pages/admin/AdminScores";
import AdminHealth from "./pages/admin/AdminHealth";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import DebugPanel from "./components/DebugPanel";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import AssessmentTrack from "./pages/AssessmentTrack";
import CandidateScoreReveal from "./pages/CandidateScoreReveal";
import ErrorBoundary from "./components/ErrorBoundary";
import StagingBanner from "./components/StagingBanner";
import StagingNav from "./components/StagingNav";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
  <StagingBanner />
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/login" element={<Login />} />
            
            <Route path="/roles/new" element={<ProtectedRoute><RolesNew /></ProtectedRoute>} />
            <Route path="/roles/create" element={<ProtectedRoute><RolesNew /></ProtectedRoute>} />
            <Route path="/roles" element={<ProtectedRoute><Roles /></ProtectedRoute>} />
            <Route path="/roles/archived" element={<ProtectedRoute><ComingSoon title="Archived roles" description="Roles you've closed or paused will appear here." /></ProtectedRoute>} />
            <Route path="/candidates" element={<ProtectedRoute><Candidates /></ProtectedRoute>} />
            <Route path="/candidates/:id" element={<ProtectedRoute><CandidateDetail /></ProtectedRoute>} />
            <Route path="/candidates/shortlisted" element={<ProtectedRoute><ComingSoon title="Shortlisted candidates" description="Your hand-picked top picks." /></ProtectedRoute>} />
            <Route path="/candidates/invited" element={<ProtectedRoute><ComingSoon title="Invited candidates" description="Candidates you've invited to interview." /></ProtectedRoute>} />
            <Route path="/interviews" element={<ProtectedRoute><Interviews /></ProtectedRoute>} />
            <Route path="/interviews/completed" element={<ProtectedRoute><ComingSoon title="Completed interviews" description="Interviews you've already wrapped up." /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/settings/notifications" element={<ProtectedRoute><ComingSoon title="Notifications" description="Choose what you'd like to be notified about." /></ProtectedRoute>} />
            <Route path="/assessment/academic-counselor" element={<AcademicCounselorAssessment />} />
            <Route path="/assessment/academic-counselor/about" element={<AcademicCounselorAbout />} />
            <Route path="/assessment/academic-counselor/start" element={<AcademicCounselorStart />} />
            <Route path="/assessment/academic-counselor/game-1" element={<AcademicCounselorGame1 />} />
            <Route path="/assessment/academic-counselor/game-2" element={<AcademicCounselorGame2 />} />
            <Route path="/assessment/academic-counselor/game-3" element={<AcademicCounselorGame3 />} />
            <Route path="/assessment/academic-counselor/game-4" element={<AcademicCounselorGame4 />} />
            <Route path="/assessment/academic-counselor/filter-1" element={<AcademicCounselorFilter1 />} />
            <Route path="/assessment/academic-counselor/filter-2" element={<AcademicCounselorFilter2 />} />
            <Route path="/assessment/academic-counselor/filter-3" element={<AcademicCounselorFilter3 />} />
            <Route path="/assessment/academic-counselor/results" element={<AcademicCounselorResults />} />
            <Route path="/assessment/academic-counselor/profile" element={<AcademicCounselorProfile />} />
            <Route path="/assessment/academic-counselor/signup" element={<CandidateSignup />} />
            <Route path="/assessment/academic-counselor/login" element={<CandidateLogin />} />
            <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
            <Route path="/candidate/profile" element={<CandidateProfile />} />
            <Route path="/candidate/settings" element={<CandidateSettings />} />
            {/* Admin */}
            <Route path="/admin" element={<AdminProtectedRoute><AdminCandidates /></AdminProtectedRoute>} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/analytics" element={<AdminProtectedRoute><AdminAnalytics /></AdminProtectedRoute>} />
            <Route path="/admin/candidates" element={<AdminProtectedRoute><AdminCandidates /></AdminProtectedRoute>} />
            <Route path="/admin/candidate/:id" element={<AdminProtectedRoute><AdminCandidateDetail /></AdminProtectedRoute>} />
            <Route path="/admin/employers" element={<AdminProtectedRoute><AdminEmployers /></AdminProtectedRoute>} />
            <Route path="/admin/employers/:id" element={<AdminProtectedRoute><AdminEmployerDetail /></AdminProtectedRoute>} />
            <Route path="/admin/settings" element={<AdminProtectedRoute><AdminSettings /></AdminProtectedRoute>} />
            <Route path="/admin/scores" element={<AdminProtectedRoute><AdminScores /></AdminProtectedRoute>} />
            <Route path="/admin/scoring-queue" element={<AdminProtectedRoute><AdminScores /></AdminProtectedRoute>} />
            <Route path="/admin/health" element={<AdminProtectedRoute><AdminHealth /></AdminProtectedRoute>} />
            <Route path="/assessment/track/:sessionId" element={<AssessmentTrack />} />
            <Route path="/results" element={<CandidateScoreReveal />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <DebugPanel />
          <StagingNav />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
