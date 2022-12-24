import { Paper, List, Pagination, Text } from "@mantine/core";
import { IconBulb, IconStars, IconUser } from "@tabler/icons";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { JsxElement } from "typescript";
import axios from "../../utils/axios";

function SearchStudiosResults({ query }: { query: string | null }) {
  const [studios, setStudios] = useState<any[]>([]);
  const [limit] = useState(10);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (query === null) return;
    axios
      .get(`/studios/search?${query}`)
      .then((res) => {
        setStudios(res.data.results);
        setCount(res.data.count);
        setTotal(Math.ceil(parseInt(res.data.count) / limit));
      })
      .catch((err) => {
        console.log(err);
      });
  }, [limit, page, query]);

  return (
    <Paper>
      {count === 0 ? (
        <Text>No results found</Text>
      ) : (
        <List spacing="sm" listStyleType="none">
          {studios.map((studio, index) => {
            return (
              <List.Item key={index}>
                <Text
                  component={Link}
                  variant="link"
                  to={`/studio/${studio.id}`}
                >
                  <b>{studio.name}</b>
                </Text>
                , located at {studio.address}
                <List ml="sm">
                  <List.Item icon={<IconStars stroke={1.5} size="1.25rem" />}>
                    <Text key={index}>
                      <b>Amenities: </b>
                      {studio.amenities
                        .map((amenity: any, index: number) => {
                          return (
                            <span key={index}>
                              {amenity.type} ({amenity.quantity})
                            </span>
                          );
                        })
                        .reduce((accu: JsxElement[], elem: JsxElement) => {
                          return accu === null
                            ? [elem]
                            : [
                                ...accu,
                                <span
                                  key={Math.floor(Math.random() * 1000000000)}
                                >
                                  ,{" "}
                                </span>,
                                elem,
                              ];
                        }, null)}
                    </Text>
                  </List.Item>
                  <List.Item icon={<IconBulb stroke={1.5} size="1.25rem" />}>
                    <b>Classes: </b>
                    {studio.classes
                      .map((cclass: any, index: number) => {
                        return (
                          <span key={index}>
                            <Text
                              component={Link}
                              variant="link"
                              to={`/studio/${studio.id}/class/${cclass.id}`}
                            >
                              <b>{cclass.name}</b>
                            </Text>{" "}
                            (<IconUser size=".75rem" /> {cclass.coach})
                          </span>
                        );
                      })
                      .reduce((accu: JsxElement[], elem: JsxElement) => {
                        return accu === null
                          ? [elem]
                          : [
                              ...accu,
                              <span
                                key={Math.floor(Math.random() * 1000000000)}
                              >
                                ,{" "}
                              </span>,
                              elem,
                            ];
                      }, null)}
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
