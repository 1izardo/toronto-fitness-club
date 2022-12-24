import {
  Paper,
  Text,
  Stack,
  Title,
  List,
  Group,
  Badge,
  Button,
  Collapse,
  ActionIcon,
  Popover,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons";
import moment from "moment";
import React, { ReactNode, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "../../utils/axios";
import UpdatePaymentInfo from "./UpdatePaymentInfo";

function paymentsToListItems(paymentList: any[]): ReactNode {
  return paymentList.map((payment: any, index: number) => {
    return (
      <List.Item key={index} pl="sm">
        <Group spacing={5}>
          <Text>
            <b>${payment.amount}</b> on{" "}
            {moment
              .parseZone(payment.date)
              .format("dddd, MMMM Do, YYYY, [at] h:mm A")}
          </Text>
          <Popover position="bottom" withArrow shadow="md">
            <Popover.Target>
              <ActionIcon radius="xl">
                <IconInfoCircle size="1rem" />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown>
              <Text size="sm">Card #: {payment.payment_info}</Text>
            </Popover.Dropdown>
          </Popover>
          {payment.cancelled ? (
            <Badge color="red">Cancelled</Badge>
          ) : payment.completed ? (
            <Badge color="green">Completed</Badge>
          ) : (
            <Badge color="yellow">Scheduled</Badge>
          )}
        </Group>
      </List.Item>
    );
  });
}

function Payments() {
  const [setActive]: [setActive: (active: string) => void] = useOutletContext();
  useEffect(() => {
    setActive("Payments");
  });

  const [opened, setOpened] = useState(false);

  const [cardNum, setCardNum] = useState("");
  const [pastCancelled, setPastCancelled] = useState([]);
  const [future, setFuture] = useState([]);

  useEffect(() => {
    // Get payment info (card number)
    axios
      .get("/accounts/profile/")
      .then((res) => {
        setCardNum(res.data.card_num);
      })
      .catch((err) => {
        console.log(err);
      });
    // Get payments
    axios
      .get("/accounts/payments/")
      .then((res) => {
        setFuture(res.data.results.slice(0, 1));
        setPastCancelled(res.data.results.slice(1));
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <Paper p="xl">
      <Title size="3rem" order={1}>
        Payments
      </Title>
      <Stack mt="sm" spacing="xs">
        <Text c="dimmed">Current card number: {cardNum}</Text>
        <Button
          onClick={() => setOpened(!opened)}
          variant="light"
          radius="xl"
          maw="max-content"
        >
          Edit payment info
        </Button>
      </Stack>
      <Collapse in={opened} maw={400}>
        <UpdatePaymentInfo />
      </Collapse>
      {pastCancelled.length === 0 && future.length === 0 ? (
        <Text mt="sm">
          There are no past or future payments to display. Payments will be
          created once you have subscribed.
        </Text>
      ) : (
        <>
          {future.length > 0 ? (
            <Stack spacing={0} my="md">
              <Title order={3} mb="sm">
                Upcoming Payment{future.length > 1 ? "s" : ""}
              </Title>
              <List spacing="sm">{paymentsToListItems(future)}</List>
            </Stack>
          ) : (
            <></>
          )}
          <Stack spacing={0} my="md">
            <Title order={3} mb="sm">
              Past Payments
            </Title>
            <List spacing="sm">{paymentsToListItems(pastCancelled)}</List>
          </Stack>
        </>
      )}
    </Paper>
  );
}

export default Payments;
