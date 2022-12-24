import { Button, Group, Select, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons";
import moment from "moment";
import { useState } from "react";
import axios from "../../utils/axios";
import {
  isValidCreditCard,
  isValidCVV,
  isValidExpiry,
} from "../../utils/validators";

function SubscribeForm({
  plans,
  subscribed,
  setSubscribed,
}: {
  plans: any[];
  subscribed: boolean;
  setSubscribed: (subscribed: boolean) => void;
}) {
  const form = useForm({
    initialValues: {
      card_num: "",
      expiry: "",
      cvv: "",
    },
    validate: {
      card_num: isValidCreditCard,
      expiry: isValidExpiry,
      cvv: isValidCVV,
    },
    validateInputOnBlur: true,
  });

  const [selection, setSelection] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = () => {
    setSubmitted(true);
    form.validate();
    if (!form.isValid() || selection == null) return;
    axios
      .put("/accounts/subscribe/", {
        subscription: plans[parseInt(selection)],
        payment_info: form.values,
      })
      .then((res) => {
        setSubscribed(!subscribed);
        showNotification({
          title: "Successfully subscribed",
          message: `Total = $${res.data.total}. Next payment is on ${moment
            .utc(res.data.next_payment)
            .format("dddd, MMMM Do, YYYY, [at] h:mm A")}.`,
          icon: <IconCheck />,
          color: "green",
          radius: "md",
          autoClose: false,
        });
        setSubmitted(false);
        setSelection(null);
      });
  };

  return (
    <form style={{ maxWidth: 400 }}>
      <Select
        required
        label="Subscription Plan"
        placeholder="Pick a plan"
        value={selection}
        onChange={setSelection}
        error={selection === null && submitted ? "Please select a plan" : false}
        data={plans.map((plan, index) => {
          return {
            value: index.toString(),
            label:
              plan.billing_cycle.charAt(0) +
              plan.billing_cycle.substring(1).toLowerCase() +
              ", $" +
              plan.charge.toFixed(2),
            disabled: plan.currently_subscribed,
          };
        })}
      />
      <TextInput
        label="Card Number"
        required
        mt="sm"
        placeholder="1234567812345678"
        {...form.getInputProps("card_num")}
      />
      <Group sx={{ alignItems: "start" }}>
        <TextInput
          label="Expiry Date"
          required
          mt="sm"
          placeholder="09/26"
          sx={{ flexGrow: 1 }}
          {...form.getInputProps("expiry")}
        />
        <TextInput
          label="CVV"
          required
          mt="sm"
          placeholder="000"
          sx={{ flexGrow: 1 }}
          {...form.getInputProps("cvv")}
        />
      </Group>
      <Group mt="xl">
        <Button onClick={handleSubscribe} sx={{ flexGrow: 1 }}>
          Subscribe to plan
        </Button>
      </Group>
    </form>
  );
}

export default SubscribeForm;
