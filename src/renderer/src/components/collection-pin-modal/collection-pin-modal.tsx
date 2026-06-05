import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Modal, TextField } from "@renderer/components";

import "./collection-pin-modal.scss";

export type CollectionPinMode = "create" | "enter" | "change";

export interface CollectionPinModalProps {
  visible: boolean;
  mode: CollectionPinMode;
  onClose: () => void;
  onCreate: (pin: string) => Promise<void> | void;
  onUnlock: (pin: string) => Promise<boolean>;
  onChangePin?: (currentPin: string, newPin: string) => Promise<boolean>;
}

const PIN_MAX_LENGTH = 12;

export function CollectionPinModal({
  visible,
  mode,
  onClose,
  onCreate,
  onUnlock,
  onChangePin,
}: Readonly<CollectionPinModalProps>) {
  const { t } = useTranslation("library");

  const [currentPin, setCurrentPin] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setCurrentPin("");
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

      if (mode === "change") {
        if (pin !== confirmPin) {
          setError(t("pin_mismatch"));
          return;
        }

        const changed = await onChangePin?.(currentPin, pin);
        if (!changed) {
          setError(t("incorrect_pin"));
          return;
        }

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

  const title =
    mode === "create"
      ? t("set_pin")
      : mode === "change"
        ? t("change_pin")
        : t("enter_pin");

  const description =
    mode === "create"
      ? t("set_pin_description")
      : mode === "change"
        ? t("change_pin_description")
        : t("enter_pin_description");

  const submitLabel =
    mode === "create"
      ? t("set_pin")
      : mode === "change"
        ? t("change_pin")
        : t("unlock_collection");

  const showConfirm = mode === "create" || mode === "change";

  return (
    <Modal
      visible={visible}
      title={title}
      description={description}
      onClose={handleClose}
    >
      <div className="collection-pin-modal">
        {mode === "change" && (
          <TextField
            label={t("current_pin")}
            type="password"
            value={currentPin}
            onChange={(event) => {
              setCurrentPin(event.target.value);
              if (error) setError(null);
            }}
            theme="dark"
            disabled={isSubmitting}
            maxLength={PIN_MAX_LENGTH}
          />
        )}

        <TextField
          label={mode === "change" ? t("new_pin") : t("enter_pin")}
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

        {showConfirm && (
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
            {submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
