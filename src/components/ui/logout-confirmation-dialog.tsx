import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LogOut, AlertTriangle } from "lucide-react";

interface LogoutConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
}

const LogoutConfirmationDialog: React.FC<LogoutConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName = "User"
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md bg-background/95 backdrop-blur-md border border-border/50 shadow-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <AlertDialogTitle className="text-lg font-semibold">
              Confirm Logout
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-muted-foreground">
            Are you sure you want to log out, <span className="font-medium text-foreground">{userName}</span>? 
            You'll need to sign in again to access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-3 pt-4">
          <AlertDialogCancel 
            onClick={onClose}
            className="flex-1 border-border/50 hover:bg-muted/50"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LogoutConfirmationDialog;
