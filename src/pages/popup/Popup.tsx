import { StarIcon } from '@chakra-ui/icons';
import {
  Badge,
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
  const [currentPos, setCurrentPos] = React.useState<number>(0);
  const [delay, setDelay] = React.useState<number>(30);
  const [isScraping, setIsScraping] = React.useState<boolean>(false);

  const handleChangeFrom = (value: number) => {
    setFrom(value);
    chrome.storage.local.set({ TEMU_from: value });
  };

  const handleChangeNumber = (value: number) => {
    setNumber(value);
    chrome.storage.local.set({ TEMU_number: value });
  };

  const handleChangeDelay = (value: number) => {
    setDelay(value);
    chrome.storage.local.set({ TEMU_delay: value });
  };

  const getURLs = () => {
    chrome.runtime.sendMessage({ type: 'GET_URLS' });
  };

  const clearURLs = () => {
    chrome.runtime.sendMessage({ type: 'CLEAR_URLS' });
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
        description: `We've added ${message.delta} urls`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setNumberOfURLs(message.total);
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
    } else if (message.type === 'CLEARED_URLS') {
      toast({
        title: `CLEAR URLs`,
        description: `We've cleared urls`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setNumberOfURLs(0);
    }
  };

  React.useEffect(() => {
    chrome.storage.local.get(
      [
        'TEMU_from',
        'TEMU_number',
        'TEMU_urls',
        'TEMU_processing',
        'TEMU_rate_min',
        'TEMU_rate_max',
        'TEMU_currentpos',
        'TEMU_delay',
      ],
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
        setSliderValue([
          typeof result.TEMU_rate_min === 'number' ? result.TEMU_rate_min : sliderValue[0],
          typeof result.TEMU_rate_max === 'number' ? result.TEMU_rate_max : sliderValue[1],
        ]);
        typeof result.TEMU_currentpos === 'number' && setCurrentPos(result.TEMU_currentpos);
        typeof result.TEMU_delay === 'number' && setDelay(result.TEMU_delay);
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
      <HStack spacing="24px" alignItems="center" justifyContent="center" mt={4} mx={2}>
        <Button w="100%" colorScheme="orange" onClick={getURLs}>
          ADD URLs
        </Button>
        <Button w="100%" colorScheme="red" variant="outline" onClick={clearURLs}>
          CLEAR URLs
        </Button>
      </HStack>
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
      <Grid templateColumns="repeat(2, 1fr)" gap={3} mt={4} mx={2}>
        <GridItem w="100%" h="10">
          <HStack spacing="24px" alignItems="center" justifyContent="center">
            <Text fontSize="md">FROM: </Text>
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
            <Text fontSize="md">NUMBER: </Text>
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
        <Text fontSize="md">DELAY(s): </Text>
        <NumberInput w="100%" value={delay} min={10} step={1} onChange={v => handleChangeDelay(parseInt(v))}>
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      </HStack>
      <HStack spacing={4} alignItems="center" justifyContent="center" mt={4} mx={2}>
        <Button
          w="100%"
          colorScheme="orange"
          leftIcon={<MdPlayArrow />}
          onClick={startScraping}
          isDisabled={isScraping}
          variant={'outline'}>
          START SCRAPING
        </Button>
        <Button w="100%" colorScheme="orange" leftIcon={<MdStop />} onClick={stopScraping} isDisabled={!isScraping}>
          STOP
        </Button>
      </HStack>
      <HStack spacing={4} alignItems="center" mt={4} mx={2}>
        <Badge>Total: {numberOfURLs} URLs</Badge>
        <Badge colorScheme="green">Current Positoin: {currentPos + 1}</Badge>
      </HStack>
    </Box>
  );
}
