import {type JSX, useMemo, useState} from "react";
import {Elements, PaymentElement, useElements, useStripe} from "@stripe/react-stripe-js";
import {getStripe} from "../../lib/stripe.ts";
import InlineHotkey from "../InlineHotkey/InlineHotkey.tsx";
import styles from "./StripePaymentForm.module.css";

/** Props for {@link StripePaymentForm}. */
interface StripePaymentFormProps {
  /** Stripe PaymentIntent client secret to confirm. */
  clientSecret: string;
  /** Called with the confirmed Stripe PaymentIntent id once payment succeeds. */
  onPaid: (paymentIntentId: string) => void;
  /** Whether the server-side accept-payment call is in flight (keeps UI busy). */
  accepting: boolean;
}

/**
 * Inner Stripe form rendered inside `<Elements>` (so it can call `useStripe`/
 * `useElements`). Confirms the payment with `redirect: "if_required"` and, on a
 * succeeded/requires-capture intent, hands the intent id to `onPaid`; otherwise
 * shows an error.
 */
function InnerForm({onPaid, accepting}: Omit<StripePaymentFormProps, "clientSecret">): JSX.Element {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    if (!stripe || !elements || submitting) return;
    setSubmitting(true);
    setError(null);

    const result = await stripe.confirmPayment({elements, redirect: "if_required"});
    if (result.error) {
      setError(result.error.message ?? "Payment failed.");
      setSubmitting(false);
      return;
    }

    const intent = result.paymentIntent;
    if (intent && (intent.status === "succeeded" || intent.status === "requires_capture")) {
      onPaid(intent.id);
    } else {
      setError("Payment could not be completed.");
      setSubmitting(false);
    }
  }

  const busy = submitting || accepting;

  return (
    <div className={styles.inner}>
      <PaymentElement/>
      {error && <p className="danger">{error}</p>}
      <InlineHotkey hotkeyFunction={pay} hotkeyKey="P" className="submit" isBlocked={busy || !stripe}>
        {busy ? "Processing..." : "Pay & create"}
      </InlineHotkey>
    </div>
  );
}

/**
 * Stripe `<Elements>` wrapper around {@link InnerForm}. The publishable key is
 * build-time injected; when it is missing the component renders a hint instead
 * of an unconfigured payment form.
 */
function StripePaymentForm({clientSecret, onPaid, accepting}: StripePaymentFormProps): JSX.Element {
  const stripePromise = useMemo(() => getStripe(), []);
  const configured = Boolean(import.meta.env.STRIPE_PUBLISHABLE_KEY);

  if (!configured) {
    return <p className="danger">Stripe publishable key is not configured.</p>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {colorPrimary: "#fca311", fontFamily: "JetBrains Mono, monospace"},
        },
      }}
    >
      <InnerForm onPaid={onPaid} accepting={accepting}/>
    </Elements>
  );
}

export default StripePaymentForm;
