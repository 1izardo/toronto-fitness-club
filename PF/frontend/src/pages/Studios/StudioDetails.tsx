import {
  Paper,
  Text,
  Title,
  List,
  Stack,
  Group,
  useMantineTheme,
  ActionIcon,
} from "@mantine/core";
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "../../utils/axios";
import parsePhoneNumberFromString from "libphonenumber-js";
import LoadingPage from "../../components/LoadingPage";
import StudioImageCarousel from "./StudioImageCarousel";
import Schedule from "./Schedule";
import { IconLocation, IconPhone, IconSearch } from "@tabler/icons";

function StudioDetails() {
  const { studio_id } = useParams();
  const theme = useMantineTheme();
  const [studio, setStudio] = useState({
    id: -1,
    name: "",
    address: "",
    postal_code: "",
    lat: "",
    long: "",
    phone_num: "",
    images: [
      {
        path: "",
      },
    ],
    directions: "",
    classes: [],
    amenities: [
      {
        type: "",
        quantity: 0,
      },
    ],
  });

  useEffect(() => {
    axios.get(`/studios/${studio_id}/details/`).then((res) => {
      setStudio(res.data);
    });
  }, [studio_id]);

  if (studio.id < 0) {
    return <LoadingPage />;
  }

  return (
    <Paper p="xl">
      <Title size="3rem" order={1}>
        {studio.name}
      </Title>
      <Stack spacing={0} mb="md">
        <Group spacing="xs">
          <IconLocation size="1rem" color={theme.primaryColor} />
          <Text
            c="dimmed"
            component="a"
            variant="link"
            href={studio.directions}
            target="_blank"
          >
            {studio.address}. {studio.postal_code}
          </Text>
        </Group>

        <Group spacing="xs">
          <IconPhone size="1rem" color={theme.primaryColor} />
          <Text
            c="dimmed"
            component="a"
            variant="link"
            href={parsePhoneNumberFromString(studio.phone_num)?.getURI()}
            target="_blank"
          >
            {parsePhoneNumberFromString(studio.phone_num)?.formatNational()}
          </Text>
        </Group>
      </Stack>
      <Title order={2} mt="md" mb="xs">
        Images
      </Title>
      <StudioImageCarousel studio={studio} />
      <Title order={2} mt="md" mb="xs">
        Amenities
      </Title>
      <List withPadding>
        {studio.amenities.map((amenity, index) => {
          return (
            <List.Item
              key={index}
            >{`${amenity.type} (${amenity.quantity})`}</List.Item>
          );
        })}
      </List>
      <Group
        sx={{
          alignItems: "flex-start",
          justifyContent: "space-between",
          maxWidth: "600px",
        }}
      >
        <Stack spacing={0}>
          <Title order={2} mt="md" mb="xs">
            Upcoming Classes
          </Title>
          <Schedule
            path={`/studios/${studio_id}/schedule`}
            studio_id={studio_id}
          />
        </Stack>
        <Stack spacing={0}>
          <Group sx={{ alignItems: "center" }} mt="md" mb="xs" spacing="xs">
            <Title order={2}>All Classes</Title>
            <ActionIcon
              radius="xl"
              p={5}
              size="lg"
              component={Link}
              to={`/search/${studio_id}`}
            >
              <IconSearch />
            </ActionIcon>
          </Group>
          <List mb="sm" listStyleType="none">
            {studio.classes.map((cclass: any, index) => {
              return (
                <List.Item>
                  <Text
                    component={Link}
                    variant="link"
                    to={`/studio/${studio_id}/class/${cclass.id}`}
                  >
                    <b>{cclass.name}</b>
                  </Text>
                </List.Item>
              );
            })}
          </List>
        </Stack>
      </Group>
    </Paper>
  );
}

export default StudioDetails;
