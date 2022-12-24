import { Paper, Group, Select, List, Pagination, Text } from "@mantine/core";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../utils/axios";
import { getCookie } from "../../utils/cookies";

function UserSchedule({ when }: { when: string }) {
  const [instances, setInstances] = useState<any[]>([]);
  const [range, setRange] = useState("7");
  const [limit] = useState(10);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [when]);

  useEffect(() => {
    axios
      .get(`/accounts/${when}/`, {
        params: {
          range: range,
          page: page,
          limit: limit,
        },
        headers: {
          Authorization: `Bearer ${getCookie("_auth")}`,
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
  }, [range, page, limit, when]);

  return (
    <Paper>
      {when !== "ongoing" ? (
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
      ) : (
        <></>
      )}
      <List mb="sm" listStyleType="none">
        {instances.map((instance, index) => {
          return (
            <List.Item key={index}>
              <Text
                component={Link}
                variant="link"
                to={`/studio/${instance.studio_id}/class/${instance.class_id}`}
              >
                <b>{instance.class_name}</b>
              </Text>{" "}
              ({instance.start_time.slice(0, -3)} to{" "}
              {instance.end_time.slice(0, -3)} on {instance.date})
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

export default UserSchedule;
