import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { AuthCallbackPage } from "../features/auth/pages/AuthCallbackPage";
import { IdeasListPage } from "../features/ideas/pages/IdeasListPage";
import { NewIdeaPage } from "../features/ideas/pages/NewIdeaPage";
import { IdeaDetailPage } from "../features/ideas/pages/IdeaDetailPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<IdeasListPage />} />
        <Route path="/ideas/new" element={<NewIdeaPage />} />
        <Route path="/ideas/:id" element={<IdeaDetailPage />} />
      </Route>
    </Routes>
  );
}
