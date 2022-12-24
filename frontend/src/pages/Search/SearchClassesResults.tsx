import { Paper, List, Pagination, Text } from "@mantine/core";
import { IconClock, IconUser } from "@tabler/icons";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../utils/axios";

function SearchStudiosResults({
  query,
  studio,
}: {
  query: string | null;
  studio: string;
}) {
  const [classes, setClasses] = useState<any[]>([]);
  const [limit] = useState(10);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (query === null) return;
    axios
      .get(`/studios/${studio}/classes/search?${query}`)
      .then((res) => {
        setClasses(res.data.results);
        setCount(res.data.count);
        setTotal(Math.ceil(parseInt(res.data.count) / limit));
      })
      .catch((err) => {
        console.log(err);
      });
  }, [limit, page, query, studio]);

  return (
    <Paper>
      {count === 0 ? (
        <Text>No results found</Text>
      ) : (
        <List spacing="sm" listStyleType="none">
          {classes.map((cclass, index) => {
            return (
              <List.Item key={index}>
                <Text
                  component={Link}
                  variant="link"
                  to={`/studio/${studio}/class/${cclass.id}`}
                >
                  <b>{cclass.name}</b>
                </Text>
                <List ml="sm">
                  <List.Item icon={<IconUser stroke={1.5} size="1.25rem" />}>
                    <Text>
                      <b>Coach:</b> {cclass.coach}
                    </Text>
                  </List.Item>
                  <List.Item icon={<IconClock stroke={1.5} size="1.25rem" />}>
                    <Text>
                      <b>Scheduled Time:</b> {cclass.start_time.slice(0, -3)} to{" "}
                      {cclass.end_time.slice(0, -3)}
                    </Text>
                  </List.Item>
                </List>
              </List.Item>
            );
          })}
        </List>
      )}
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

export default SearchStudiosResults;
