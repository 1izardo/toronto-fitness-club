import {
  Title,
  Paper,
  Group,
  FileButton,
  Avatar,
  Anchor,
  TextInput,
  PasswordInput,
  Button,
  Text,
  Divider,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons";
import parsePhoneNumberFromString from "libphonenumber-js";
import React, { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "../../utils/axios";
import {
  isValidEmail,
  isValidPassword,
  isValidPhoneNum,
} from "../../utils/validators";

function Profile() {
  const [setActive]: [setActive: (active: string) => void] = useOutletContext();

  useEffect(() => {
    setActive("Profile");
  });

  const form = useForm({
    validate: {
      email: isValidEmail,
      new_password: (value) => {
        if (value === "") return;
        return isValidPassword(value);
      },
      confirm_new_password: (value, values) => {
        return value === values.new_password ? null : "Passwords do not match";
      },
      phone_num: (value) => {
        if (value === "") return;
        return isValidPhoneNum(value);
      },
    },
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      old_password: "",
      new_password: "",
      confirm_new_password: "",
      phone_num: "",
    },
    validateInputOnBlur: true,
  });

  const [file, setFile] = useState<File | null>(null);
  const [avatar, setAvatar] = useState("");
  const firstNameRef = useRef<HTMLInputElement>();
  const lastNameRef = useRef<HTMLInputElement>();
  const emailRef = useRef<HTMLInputElement>();
  const phoneNumRef = useRef<HTMLInputElement>();
  const oldPasswordRef = useRef<HTMLInputElement>();
  const newPasswordRef = useRef<HTMLInputElement>();

  useEffect(() => {
    axios
      .get("/accounts/profile/")
      .then((res) => {
        form.setValues({
          first_name: res.data.first_name ? res.data.first_name : "",
          last_name: res.data.last_name ? res.data.last_name : "",
          phone_num: res.data.phone_num
            ? parsePhoneNumberFromString(res.data.phone_num, {
                defaultCountry: "CA",
              })?.formatNational()
            : "",
          email: res.data.email ? res.data.email : "",
        });
        if (res.data.avatar)
          setAvatar(axios.defaults.baseURL + res.data.avatar);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const handleProfileEdit = () => {
    axios
      .patch(
        "/accounts/profile/",
        {
          ...(file && { avatar: file }),
          first_name: firstNameRef.current?.value,
          last_name: lastNameRef.current?.value,
          phone_num: phoneNumRef.current?.value,
          email: emailRef.current?.value,
          ...(oldPasswordRef.current?.value && {
            old_password: oldPasswordRef.current?.value,
          }),
          ...(newPasswordRef.current?.value && {
            new_password: newPasswordRef.current?.value,
          }),
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      )
      .then((res) => {
        showNotification({
          title: "Edit successful!",
          message: "Profile info has been updated",
          color: "green",
          icon: <IconCheck />,
        });
        form.setValues({
          old_password: "",
          new_password: "",
          confirm_new_password: "",
          phone_num: res.data.phone_num
            ? parsePhoneNumberFromString(res.data.phone_num, {
                defaultCountry: "CA",
              })?.formatNational()
            : "",
        });
      })
      .catch((err) => {
        if (err.response.status === 400) {
          for (const field of Object.keys(err.response.data)) {
            console.log(field);
            form.setFieldError(
              field,
              err.response.data[field].replaceAll(".", "")
            );
          }
        } else {
          console.log(err);
        }
      });
  };

  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
      p="xl"
    >
      <Title align="center">Edit Profile</Title>

      <Paper mt={30} radius="md" w="100%" maw={450}>
        <form noValidate={true}>
          <Group position="center">
            <FileButton onChange={setFile} accept="image/png,image/jpeg">
              {(props) => (
                <Avatar
                  radius={75}
                  size={75}
                  src={file ? URL.createObjectURL(file) : avatar ? avatar : ""}
                  sx={(theme) => ({
                    cursor: "pointer",
                    border: "2px solid",
                    borderColor: theme.primaryColor,
                  })}
                  color="primary"
                  {...props}
                />
              )}
            </FileButton>
          </Group>
          {file ? (
            <Anchor color="red" onClick={() => setFile(null)}>
              <Text size="sm" mt="sm" align="center">
                Reset
              </Text>
            </Anchor>
          ) : (
            <FileButton onChange={setFile} accept="image/png,image/jpeg">
              {(props) => (
                <Anchor {...props}>
                  <Text size="sm" align="center" mt="xs">
                    Upload image
                  </Text>
                </Anchor>
              )}
            </FileButton>
          )}

          <TextInput
            label="First Name"
            placeholder="Jane"
            ref={firstNameRef}
            mt="md"
            {...form.getInputProps("first_name")}
          />
          <TextInput
            label="Last Name"
            placeholder="Doe"
            ref={lastNameRef}
            mt="md"
            {...form.getInputProps("last_name")}
          />
          <TextInput
            label="Phone Number"
            type="tel"
            placeholder="416-555-5555"
            ref={phoneNumRef}
            mt="md"
            {...form.getInputProps("phone_num")}
          />
          <TextInput
            label="Email"
            type="email"
            placeholder="example@email.com"
            ref={emailRef}
            mt="md"
            {...form.getInputProps("email")}
          />
          <Divider mt="lg" variant="dashed" />
          <PasswordInput
            label="Old Password"
            ref={oldPasswordRef}
            mt="md"
            {...form.getInputProps("old_password")}
          />
          <PasswordInput
            label="New Password"
            ref={newPasswordRef}
            mt="md"
            {...form.getInputProps("new_password")}
          />
          <PasswordInput
            label="Confirm New Password"
            mt="md"
            {...form.getInputProps("confirm_new_password")}
          />
          <Button fullWidth my="xl" onClick={handleProfileEdit}>
            Edit Profile
          </Button>
        </form>
      </Paper>
    </Paper>
  );
}

export default Profile;
