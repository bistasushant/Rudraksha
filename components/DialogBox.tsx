"use client";
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogOverlay,
  AlertDialogPortal,
} from "@radix-ui/react-alert-dialog";

interface DialogBoxProps {
  isVisible: boolean;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}

const DialogBox: React.FC<DialogBoxProps> = ({
  isVisible,
  message,
  onClose,
  onConfirm,
}) => {
  return (
    <AlertDialog open={isVisible} onOpenChange={onClose}>
      <AlertDialogPortal>
        <AlertDialogOverlay className="fixed inset-0 bg-black/30" />
        <AlertDialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] border-4 rounded-xl p-5 bg-white shadow-lg w-[90vw] max-w-md">
          <AlertDialogTitle className="text-2xl font-bold mb-2">
            Remove Item
          </AlertDialogTitle>
          <AlertDialogDescription className="text-lg mb-4">
            {message}
          </AlertDialogDescription>
          <div className="flex justify-end space-x-6">
            <AlertDialogCancel className="text-gray-500 hover:text-gray-700 px-4 py-2">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              className="bg-red-500 rounded-md text-white px-4 py-2 hover:bg-red-600"
            >
              Remove
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialog>
  );
};

export default DialogBox;
