import { Paper, Title, Text, Stack, List, Group, Button } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "../../utils/axios";
import LoadingPage from "../../components/LoadingPage";
import SubscribeForm from "./SubscribeForm";

function Subscriptions() {
  const [setActive]: [setActive: (active: string) => void] = useOutletContext();

  useEffect(() => {
    setActive("Subscriptions");
  });

  const [plans, setPlans] = useState([
    {
      billing_cycle: "",
      charge: -1,
      currently_subscribed: false,
      cancelled_payment: false,
    },
  ]);
  const [subscribed, setSubscribed] = useState(false);

  const handleUnsubscribe = () => {
    axios
      .delete("/accounts/subscribe/")
      .then((res) => {
        showNotification({
          title: "Successfully unsubscribed",
          message: `Days remaining: ${res.data.days_remaining}`,
          icon: <IconCheck />,
          color: "green",
          radius: "md",
          autoClose: false,
        });
        setSubscribed(!subscribed);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleResubscribe = (plan: any) => {
    axios
      .put("/accounts/subscribe/", {
        subscription: plan,
      })
      .then((res) => {
        showNotification({
          title: "Successfully resubscribed",
          message:
            "You will be charged for your current subscription at the end of the billing cycle",
          icon: <IconCheck />,
          color: "green",
          radius: "md",
          autoClose: false,
        });
        setSubscribed(!subscribed);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    console.log();
    axios
      .get("/accounts/subscribe/")
      .then((res) => {
        setPlans(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [subscribed]);

  if (plans[0]?.charge === -1) {
    return <LoadingPage />;
  }

  return (
    <Paper p="xl">
      <Title size="3rem" order={1} pb="sm">
        Subscriptions
      </Title>
      <Stack spacing="xs">
        <Title order={2}>Available Plans</Title>
        <List mb="sm" type="ordered">
          {plans.map((plan, index) => {
            return (
              <List.Item key={index}>
                <Group spacing="xs">
                  <Text>
                    {plan.billing_cycle.charAt(0) +
                      plan.billing_cycle.substring(1).toLowerCase()}
                    , ${plan.charge.toFixed(2)}{" "}
                    {plan.currently_subscribed ? "(current plan)" : ""}
                  </Text>
                  {plan.currently_subscribed && !plan.cancelled_payment ? (
                    <Button
                      size="xs"
                      color="red"
                      variant="outline"
                      radius="xl"
                      onClick={handleUnsubscribe}
                    >
                      Unsubscribe
                    </Button>
                  ) : plan.currently_subscribed && plan.cancelled_payment ? (
                    <Button
                      size="xs"
                      color="orange"
                      variant="outline"
                      radius="xl"
                      onClick={() => handleResubscribe(plan)}
                    >
                      Resubscribe
                    </Button>
                  ) : (
                    <></>
                  )}
                </Group>
              </List.Item>
            );
          })}
        </List>
      </Stack>
      <Stack spacing="xs">
        <Title order={2}>Subscribe to New Plan</Title>
        <SubscribeForm
          plans={plans}
          subscribed={subscribed}
          setSubscribed={setSubscribed}
        />
      </Stack>
    </Paper>
  );
}

export default Subscriptions;
