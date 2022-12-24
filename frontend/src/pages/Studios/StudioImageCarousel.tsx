import { Carousel } from "@mantine/carousel";
import { Image, Text } from "@mantine/core";
import axios from "../../utils/axios";

function StudioImageCarousel({ studio }: { studio: any }) {
  if (studio.images.length === 0) {
    return <Text>This studio has no images.</Text>;
  }
  return (
    <Carousel
      align="center"
      w="100%"
      sx={{ maxWidth: "400px" }}
      slideGap="md"
      controlSize={20}
      withIndicators
      loop
    >
      {studio.images.map((image: any, index: number) => (
        <Carousel.Slide key={index} sx={{ "*": { height: "100% !important" } }}>
          <Image
            src={axios.defaults.baseURL + image.path}
            fit="cover"
            radius="md"
          />
        </Carousel.Slide>
      ))}
    </Carousel>
  );
}

export default StudioImageCarousel;
