import { StarIcon } from '@chakra-ui/icons';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Grid,
  GridItem,
  HStack,
  Heading,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  RangeSlider,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  RangeSliderTrack,
  Text,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import React from 'react';
import { MdPlayArrow, MdStop } from 'react-icons/md';

export default function Popup() {
  const toast = useToast();

  const [sliderValue, setSliderValue] = React.useState([1, 4]);
  const [from, setFrom] = React.useState<number>(1);
  const [number, setNumber] = React.useState<number>(250);
  const [numberOfURLs, setNumberOfURLs] = React.useState<number>(0);
  const [isScraping, setIsScraping] = React.useState<boolean>(false);

  const handleChangeFrom = (value: number) => {
    setFrom(value);
    chrome.storage.local.set({ TEMU_from: value });
  };

  const handleChangeNumber = (value: number) => {
    setNumber(value);
    chrome.storage.local.set({ TEMU_number: value });
  };

  const getURLs = () => {
    chrome.runtime.sendMessage({ type: 'GET_URLS' });
  };

  const startScraping = () => {
    chrome.runtime.sendMessage({
      type: 'START_PROCESSING',
    });
  };

  const stopScraping = () => {
    chrome.runtime.sendMessage({ type: 'STOP_PROCESSING' });
  };

  const handleRateChange = (value: number[]) => {
    setSliderValue(value);
    chrome.storage.local.set({ TEMU_rate_min: value[0], TEMU_rate_max: value[1] });
  };

  const handleOnMessage = function (message) {
    if (message.type === 'RECEIVE_URL') {
      toast({
        title: `GET URLS`,
        description: `We've found ${message.urls} urls`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setNumberOfURLs(message.urls);
    } else if (message.type === 'STARTED_PROCESSING') {
      toast({
        title: `STARTED PROCESSING`,
        description: `We've started processing`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setIsScraping(true);
    } else if (message.type === 'STOPPED_PROCESSING') {
      toast({
        title: `STOPPED PROCESSING`,
        description: `We've stopped processing`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setIsScraping(false);
    }
  };

  React.useEffect(() => {
    chrome.storage.local.get(
      ['TEMU_from', 'TEMU_number', 'TEMU_urls', 'TEMU_processing', 'TEMU_rate_min', 'TEMU_rate_max'],
      function (result) {
        console.log(result);
        if (result.TEMU_from) {
          setFrom(result.TEMU_from);
        }
        if (result.TEMU_number) {
          setNumber(result.TEMU_number);
        }
        if (result.TEMU_urls) {
          setNumberOfURLs(result.TEMU_urls.length);
        }
        if (result.TEMU_processing) {
          setIsScraping(result.TEMU_processing);
        }
        if (result.TEMU_rate_min || result.TEMU_rate_max) {
          setSliderValue([
            typeof result.TEMU_rate_min === 'number' ? result.TEMU_rate_min : sliderValue[0],
            typeof result.TEMU_rate_max === 'number' ? result.TEMU_rate_max : sliderValue[1],
          ]);
        }
      },
    );

    chrome.runtime.onMessage.addListener(handleOnMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleOnMessage);
    };
  }, []);

  return (
    <Box w="100%" p={4}>
      <Heading size="lg" mb={4} textAlign={'center'}>
        TEMU Scraping
      </Heading>
      <Button w="100%" colorScheme="orange" onClick={getURLs}>
        GET URLs
      </Button>
      <HStack spacing="24px" alignItems="center" justifyContent="center" mt={4} mx={2}>
        <Text fontSize="md">Rate: </Text>
        <RangeSlider min={0} max={5} step={1} value={sliderValue} onChange={v => handleRateChange(v)}>
          <RangeSliderTrack bg="red.100">
            <RangeSliderFilledTrack bg="orange" />
          </RangeSliderTrack>
          <Tooltip hasArrow bg="teal.500" color="white" placement="top" label={`${sliderValue[0]}`}>
            <RangeSliderThumb boxSize={6} index={0}>
              <Box color="orange" as={StarIcon} />
            </RangeSliderThumb>
          </Tooltip>
          <Tooltip hasArrow bg="teal.500" color="white" placement="top" label={`${sliderValue[1]}`}>
            <RangeSliderThumb boxSize={6} index={1}>
              <Box color="orange" as={StarIcon} />
            </RangeSliderThumb>
          </Tooltip>
        </RangeSlider>
      </HStack>
      <Grid templateColumns="repeat(2, 1fr)" gap={6} mt={4} mx={2}>
        <GridItem w="100%" h="10">
          <HStack spacing="24px" alignItems="center" justifyContent="center">
            <Text fontSize="md">From: </Text>
            <NumberInput value={from} min={1} step={1} onChange={v => handleChangeFrom(parseInt(v))}>
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </HStack>
        </GridItem>
        <GridItem w="100%" h="10">
          <HStack spacing="24px" alignItems="center" justifyContent="center">
            <Text fontSize="md">Number: </Text>
            <NumberInput value={number} min={1} step={1} onChange={v => handleChangeNumber(parseInt(v))}>
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </HStack>
        </GridItem>
      </Grid>
      <HStack spacing={4} alignItems="center" justifyContent="center" mt={4} mx={2}>
        <Button
          w="100%"
          colorScheme="orange"
          leftIcon={<MdPlayArrow />}
          onClick={startScraping}
          isDisabled={isScraping}
          variant={'outline'}>
          Start Scraping
        </Button>
        <Button w="100%" colorScheme="orange" leftIcon={<MdStop />} onClick={stopScraping} isDisabled={!isScraping}>
          Stop
        </Button>
      </HStack>
      <Alert status="info" p={2} mt={6} rounded={6}>
        <AlertIcon />
        There are {numberOfURLs} urls in total
      </Alert>
    </Box>
  );
}
