"use client";

import React from "react";
import { AdminUsersView } from "@/views/AdminUsersView";

export const CoordinatorProfilesView: React.FC = () => {
  return <AdminUsersView mode="coordinator" />;
};
