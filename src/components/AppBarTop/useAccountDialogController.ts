"use client";

import { useAccountSubmission } from "./useAccountSubmission";
import { useState, type Dispatch, type SetStateAction } from "react";
import type {
  TypeAccountDialogMode,
  TypeGuestProfileState,
  TypeAccountSessionState,
} from "@/types";

interface IProps {
  guestProfile: TypeGuestProfileState;
  accountSession: TypeAccountSessionState | null;
  setAccountSession: Dispatch<SetStateAction<TypeAccountSessionState | null>>;
}

export function useAccountDialogController({
  guestProfile,
  accountSession,
  setAccountSession,
}: IProps) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasAttemptedAccountSubmit, setHasAttemptedAccountSubmit] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [accountDialogMode, setAccountDialogMode] =
    useState<TypeAccountDialogMode>("signUp");

  const resetAccountForm = () => {
    setDisplayName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setWorkspaceName("");
    setSubmitError(null);
    setHasAttemptedAccountSubmit(false);
    setIsPasswordVisible(false);
    setIsConfirmPasswordVisible(false);
  };

  const openCreateAccountDialog = (mode: TypeAccountDialogMode = "signUp") => {
    setAccountDialogMode(mode);
    setDisplayName(accountSession?.displayName || guestProfile.displayName);
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setIsPasswordVisible(false);
    setIsConfirmPasswordVisible(false);
    setSubmitError(null);
    setHasAttemptedAccountSubmit(false);
    setIsCreateAccountOpen(true);
  };

  const closeCreateAccountDialog = () => {
    setIsCreateAccountOpen(false);
    setSubmitError(null);
    setHasAttemptedAccountSubmit(false);
    setAccountDialogMode("signUp");
  };

  const updateField = (
    field:
      | "displayName"
      | "username"
      | "email"
      | "password"
      | "confirmPassword"
      | "workspaceName",
    value: string,
  ) => {
    if (field === "displayName") setDisplayName(value);
    if (field === "username") setUsername(value);
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    if (field === "confirmPassword") setConfirmPassword(value);
    if (field === "workspaceName") setWorkspaceName(value);
  };

  const togglePassword = (field: "password" | "confirmPassword") => {
    if (field === "password") {
      setIsPasswordVisible((visible) => !visible);
    } else {
      setIsConfirmPasswordVisible((visible) => !visible);
    }
  };

  const handleCreateAccount = useAccountSubmission({
    accountDialogMode,
    displayName,
    username,
    email,
    password,
    confirmPassword,
    workspaceName,
    setAccountSession,
    setHasAttemptedAccountSubmit,
    setIsSubmitting,
    setSubmitError,
    closeCreateAccountDialog,
  });

  return {
    displayName,
    username,
    email,
    password,
    confirmPassword,
    isPasswordVisible,
    isConfirmPasswordVisible,
    submitError,
    hasAttemptedAccountSubmit,
    isSubmitting,
    workspaceName,
    isCreateAccountOpen,
    accountDialogMode,
    updateField,
    togglePassword,
    resetAccountForm,
    openCreateAccountDialog,
    closeCreateAccountDialog,
    handleCreateAccount,
  };
}
