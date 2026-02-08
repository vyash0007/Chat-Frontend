'use client';

import React, { useState } from 'react';
import { Modal, Input, Button } from '@/components/ui';
import { useInvitationStore } from '@/store/invitationStore';
import { InvitationType } from '@/types';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatName: string | null;
  defaultType?: InvitationType;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  chatId,
  chatName,
  defaultType = InvitationType.PERMANENT_MEMBER,
}) => {
  const { createInvitation, isLoading, error, clearError } = useInvitationStore();
  const [email, setEmail] = useState('');
  const [invitationType, setInvitationType] = useState<InvitationType>(defaultType);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    try {
      await createInvitation({
        chatId,
        invitedEmail: email.trim(),
        type: invitationType,
      });

      setSuccessMessage('Invitation sent successfully!');
      setEmail('');

      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 2000);
    } catch {
      // Error is handled by store
    }
  };

  const handleClose = () => {
    setEmail('');
    setSuccessMessage('');
    clearError();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Invite to ${chatName || 'Chat'}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Email Address
          </label>
          <Input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
          <p className="text-xs text-[var(--text-muted)] mt-1">
            User must be registered with this email
          </p>
        </div>

        {/* Invitation Type Selection */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Invitation Type
          </label>
          <div className="space-y-2">
            <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
              invitationType === InvitationType.PERMANENT_MEMBER
                ? 'border-[var(--accent-primary)] bg-[var(--background-hover)]'
                : 'border-[var(--divider-color)] hover:bg-[var(--background-hover)]'
            }`}>
              <input
                type="radio"
                name="invitationType"
                value={InvitationType.PERMANENT_MEMBER}
                checked={invitationType === InvitationType.PERMANENT_MEMBER}
                onChange={(e) => setInvitationType(e.target.value as InvitationType)}
                disabled={isLoading}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-[var(--text-primary)]">
                  Permanent Member
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  Add user as a permanent member of the group chat
                </div>
              </div>
            </label>

            <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
              invitationType === InvitationType.TEMPORARY_CALL
                ? 'border-[var(--accent-primary)] bg-[var(--background-hover)]'
                : 'border-[var(--divider-color)] hover:bg-[var(--background-hover)]'
            }`}>
              <input
                type="radio"
                name="invitationType"
                value={InvitationType.TEMPORARY_CALL}
                checked={invitationType === InvitationType.TEMPORARY_CALL}
                onChange={(e) => setInvitationType(e.target.value as InvitationType)}
                disabled={isLoading}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-[var(--text-primary)]">
                  Temporary Call Access
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  Allow user to join an ongoing call without becoming a member
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
