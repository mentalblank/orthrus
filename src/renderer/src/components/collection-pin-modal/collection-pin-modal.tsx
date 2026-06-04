import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Modal, TextField } from "@renderer/components";

import "./collection-pin-modal.scss";

export type CollectionPinMode = "create" | "enter";

export interface CollectionPinModalProps {
  visible: boolean;
  mode: CollectionPinMode;
  onClose: () => void;
  onCreate: (pin: string) => Promise<void> | void;
  onUnlock: (pin: string) => Promise<boolean>;
}

const PIN_MAX_LENGTH = 12;

export function CollectionPinModal({
  visible,
  mode,
  onClose,
  onCreate,
  onUnlock,
}: Readonly<CollectionPinModalProps>) {
  const { t } = useTranslation("library");

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPin("");
    setConfirmPin("");
    setError(null);
    setIsSubmitting(false);
  }, [visible]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!pin.trim()) {
      setError(t("enter_pin"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === "create") {
        if (pin !== confirmPin) {
          setError(t("pin_mismatch"));
          return;
        }

        await onCreate(pin);
        onClose();
        return;
      }

      const matched = await onUnlock(pin);
      if (!matched) {
        setError(t("incorrect_pin"));
        return;
      }

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      title={mode === "create" ? t("set_pin") : t("enter_pin")}
      description={
        mode === "create"
          ? t("set_pin_description")
          : t("enter_pin_description")
      }
      onClose={handleClose}
    >
      <div className="collection-pin-modal">
        <TextField
          label={t("enter_pin")}
          type="password"
          value={pin}
          onChange={(event) => {
            setPin(event.target.value);
            if (error) setError(null);
          }}
          theme="dark"
          disabled={isSubmitting}
          maxLength={PIN_MAX_LENGTH}
          error={mode === "enter" ? error : null}
        />

        {mode === "create" && (
          <TextField
            label={t("confirm_pin")}
            type="password"
            value={confirmPin}
            onChange={(event) => {
              setConfirmPin(event.target.value);
              if (error) setError(null);
            }}
            theme="dark"
            disabled={isSubmitting}
            maxLength={PIN_MAX_LENGTH}
            error={error}
          />
        )}

        <div className="collection-pin-modal__actions">
          <Button
            type="button"
            theme="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {t("cancel", { ns: "sidebar" })}
          </Button>

          <Button
            type="button"
            theme="primary"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={!pin.trim() || isSubmitting}
          >
            {mode === "create" ? t("set_pin") : t("unlock_collection")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
