import { TextInput, Group, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons";
import React from "react";
import axios from "../../utils/axios";
import {
  isValidCreditCard,
  isValidExpiry,
  isValidCVV,
} from "../../utils/validators";

function UpdatePaymentInfo() {
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

  const handleChangeInfo = () => {
    form.validate();
    if (!form.isValid()) return;
    axios
      .patch("/accounts/profile/", {
        payment_info: form.values,
      })
      .then((res) => {
        showNotification({
          title: "Successfully updated payment info",
          message: `Future payments will use card ${res.data.card_num}`,
          icon: <IconCheck />,
          color: "green",
          radius: "md",
          autoClose: 5000,
        });
      });
  };

  return (
    <form>
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
        <Button onClick={handleChangeInfo} sx={{ flexGrow: 1 }}>
          Update info
        </Button>
      </Group>
    </form>
  );
}

export default UpdatePaymentInfo;
