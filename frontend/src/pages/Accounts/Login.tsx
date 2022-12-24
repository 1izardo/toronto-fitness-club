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
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useRef } from "react";
import { useSignIn } from "react-auth-kit";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../utils/axios";
import { isValidEmail, isValidPassword } from "../../utils/validators";

function Login() {
  const form = useForm({
    validate: {
      email: isValidEmail,
      password: isValidPassword,
    },
    initialValues: {
      email: "",
      password: "",
    },
    validateInputOnBlur: true,
  });

  const emailRef = useRef<HTMLInputElement>();
  const passwordRef = useRef<HTMLInputElement>();
  const signIn = useSignIn();
  const navigate = useNavigate();

  const handleLogin = () => {
    axios
      .post("/accounts/login/", {
        email: emailRef.current?.value,
        password: passwordRef.current?.value,
      })
      .then((res) => {
        signIn({
          token: res.data.access,
          tokenType: "Bearer",
          expiresIn: 1440,
          authState: {
            email: emailRef.current?.value,
          },
        });
        navigate("/");
      })
      .catch((err) => {
        if (err.response.status === 401) {
          form.setFieldError(
            "email",
            "No account exists with given credentials"
          );
        } else {
          console.log(err);
        }
      });
  };

  return (
    <Center style={{ width: "100vw", height: "100vh" }}>
      <Container mx={0} maw={420} w="100%">
        <Title align="center">Log in to TFC</Title>

        <Paper withBorder shadow="sm" p={30} mt={30} radius="md">
          <form onSubmit={form.onSubmit(handleLogin)} noValidate={true}>
            <TextInput
              label="Email"
              required
              {...form.getInputProps("email")}
              ref={emailRef}
            />
            <PasswordInput
              label="Password"
              required
              mt="md"
              {...form.getInputProps("password")}
              ref={passwordRef}
            />
            <Button fullWidth mt="xl" type="submit">
              Sign in
            </Button>
          </form>
        </Paper>
        <Text color="dimmed" size="sm" align="center" mt={15}>
          Need an account?{" "}
          <Anchor component={Link} variant="link" to="/register" size="sm">
            Register
          </Anchor>
        </Text>
      </Container>
    </Center>
  );
}

export default Login;
