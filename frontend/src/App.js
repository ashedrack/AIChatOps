import React, { useState } from 'react';
import {
  ChakraProvider,
  Box,
  VStack,
  Input,
  Button,
  Text,
  Container,
  Heading,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';

function App() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await axios.post(process.env.REACT_APP_API_URL + '/chat/', {
        prompt: prompt
      });
      setResponse(result.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to get response',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChakraProvider>
      <Container maxW="container.md" py={10}>
        <VStack spacing={8}>
          <Heading>AI Chat</Heading>
          
          <Box w="100%" as="form" onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <Input
                placeholder="Enter your question..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                size="lg"
              />
              <Button
                colorScheme="blue"
                type="submit"
                isLoading={isLoading}
                w="100%"
              >
                Ask AI
              </Button>
            </VStack>
          </Box>

          {response && (
            <Box
              w="100%"
              p={4}
              borderWidth={1}
              borderRadius="md"
              bg="gray.50"
            >
              <Text whiteSpace="pre-wrap">{response}</Text>
            </Box>
          )}
        </VStack>
      </Container>
    </ChakraProvider>
  );
}

export default App;
