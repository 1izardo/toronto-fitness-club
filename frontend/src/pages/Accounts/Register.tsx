import {
  TextInput,
  PasswordInput,
  Anchor,
  Paper,
  Title,
  Text,
  Container,
  Button,
  Center,
  FileButton,
  Group,
  Avatar,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../utils/axios";
import {
  isValidEmail,
  isValidPassword,
  isValidPhoneNum,
} from "../../utils/validators";

function Register() {
  const form = useForm({
    validate: {
      email: isValidEmail,
      password: isValidPassword,
      confirmPassword: (value, values) => {
        return value === values.password ? null : "Passwords do not match";
      },
      phoneNum: (value) => {
        if (value === "") return;
        return isValidPhoneNum(value);
      },
    },
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNum: "",
    },
    validateInputOnBlur: true,
  });
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const firstNameRef = useRef<HTMLInputElement>();
  const lastNameRef = useRef<HTMLInputElement>();
  const emailRef = useRef<HTMLInputElement>();
  const phoneNumRef = useRef<HTMLInputElement>();
  const passwordRef = useRef<HTMLInputElement>();

  const handleRegister = () => {
    axios
      .post(
        "/accounts/register/",
        {
          ...(file && { avatar: file }),
          first_name: firstNameRef.current?.value,
          last_name: lastNameRef.current?.value,
          phone_num: phoneNumRef.current?.value,
          email: emailRef.current?.value,
          password: passwordRef.current?.value,
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      )
      .then((res) => {
        showNotification({
          title: "Registration successful!",
          message: "You may now log in",
          color: "green",
          icon: <IconCheck />,
        });
        navigate("/login");
      })
      .catch((err) => {
        if (err.response.status === 400) {
          console.log(err.response);
          for (const field of Object.keys(err.response.data)) {
            form.setFieldError(
              field,
              err.response.data[field][0].replaceAll(".", "")
            );
          }
        } else {
          console.log(err);
        }
      });
  };

  return (
    <Center style={{ minHeight: "100vh" }} py={50}>
      <Container mx={0} maw={500} w="100%">
        <Title align="center">Register for TFC</Title>

        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <form noValidate={true}>
            <Group position="center">
              <FileButton onChange={setFile} accept="image/png,image/jpeg">
                {(props) => (
                  <Avatar
                    radius={75}
                    size={75}
                    src={file ? URL.createObjectURL(file) : ""}
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
              {...form.getInputProps("firstName")}
            />
            <TextInput
              label="Last Name"
              placeholder="Doe"
              ref={lastNameRef}
              mt="md"
              {...form.getInputProps("lastName")}
            />
            <TextInput
              label="Phone Number"
              type="tel"
              placeholder="416-555-5555"
              ref={phoneNumRef}
              mt="md"
              {...form.getInputProps("phoneNum")}
            />
            <TextInput
              label="Email"
              type="email"
              placeholder="example@email.com"
              ref={emailRef}
              mt="md"
              required
              {...form.getInputProps("email")}
            />
            <PasswordInput
              label="Password"
              ref={passwordRef}
              required
              mt="md"
              {...form.getInputProps("password")}
            />
            <PasswordInput
              label="Confirm Password"
              required
              mt="md"
              {...form.getInputProps("confirmPassword")}
            />
            <Button fullWidth mt="xl" onClick={handleRegister}>
              Register
            </Button>
          </form>
        </Paper>
        <Text color="dimmed" size="sm" align="center" mt={15}>
          Already have an account?{" "}
          <Anchor component={Link} variant="link" to="/login" size="sm">
            Log in
          </Anchor>
        </Text>
      </Container>
    </Center>
  );
}

export default Register;
