import {
  ActionIcon,
  Group,
  List,
  Pagination,
  Paper,
  Select,
  Text,
} from "@mantine/core";
import axios from "../../utils/axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EnrolledPopover from "../Classes/EnrolledPopover";
import { IconInfoCircle } from "@tabler/icons";

function Schedule({
  path,
  studio_id,
  class_id,
  enrolled,
}: {
  path: string;
  studio_id?: string | null;
  class_id?: string | null;
  enrolled?: boolean | null;
}) {
  const [instances, setInstances] = useState<any[]>([]);
  const [range, setRange] = useState("7");
  const [limit] = useState(10);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    axios
      .get(path, {
        params: {
          range: range,
          page: page,
          limit: limit,
        },
      })
      .then((res) => {
        setInstances(res.data.results);
        setCount(res.data.count);
        setTotal(Math.ceil(parseInt(res.data.count) / limit));
      })
      .catch((err) => {
        console.log(err);
      });
  }, [path, range, page, limit]);

  return (
    <Paper>
      <Group mb="sm" spacing="xs">
        <Text size="sm">Date range:</Text>
        <Select
          size="xs"
          radius="xl"
          placeholder="Range"
          value={range}
          onChange={(value: string) => {
            setPage(1);
            setRange(value);
          }}
          maw={100}
          data={[
            { value: "7", label: "7 days" },
            { value: "14", label: "14 days" },
            { value: "30", label: "30 days" },
            { value: "365", label: "1 year" },
          ]}
        />
      </Group>
      <List mb="sm" listStyleType="none">
        {instances.map((instance, index) => {
          return (
            <List.Item key={index}>
              {class_id ? (
                <Group spacing={3}>
                  <Text>
                    From {instance.start_time.slice(0, -3)} to{" "}
                    {instance.end_time.slice(0, -3)} on {instance.date}
                  </Text>
                  <EnrolledPopover
                    details={instance.details}
                    enrolled={enrolled}
                  >
                    <ActionIcon
                      color="primary"
                      variant="transparent"
                      sx={(theme) => ({
                        color:
                          theme.colorScheme === "dark"
                            ? theme.colors.orange[7]
                            : theme.colors.orange[6],
                      })}
                    >
                      <IconInfoCircle size="1rem" />
                    </ActionIcon>
                  </EnrolledPopover>
                </Group>
              ) : (
                <>
                  <Text
                    component={Link}
                    variant="link"
                    to={`/studio/${studio_id}/class/${instance.class_id}`}
                  >
                    <b>{instance.class_name}</b>
                  </Text>{" "}
                  ({instance.start_time.slice(0, -3)} to{" "}
                  {instance.end_time.slice(0, -3)} on {instance.date})
                </>
              )}
            </List.Item>
          );
        })}
      </List>
      {count <= limit ? (
        <></>
      ) : (
        <Pagination
          page={page}
          onChange={setPage}
          total={total}
          sx={(theme) => ({
            button: { borderRadius: theme.radius.md, border: "none" },
          })}
        />
      )}
    </Paper>
  );
}

export default Schedule;
