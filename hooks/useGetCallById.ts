import { useEffect, useState } from 'react';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { toast } from 'sonner';


interface UseGetCallByIdResult {
  call: Call | undefined;
  isCallLoading: boolean;
  isCallInvalid: boolean; 
}


export const useGetCallById = (id: string | string[]) => {
  const [call, setCall] = useState<Call>();
  const [isCallLoading, setIsCallLoading] = useState(true);
   const [isCallInvalid, setIsCallInvalid] = useState(false);

  const client = useStreamVideoClient();

  useEffect(() => {
     console.log("useGetCallById - received id prop:", id);
    const callId = Array.isArray(id) ? id[0] : id;
    console.log("useGetCallById - resolved callId:", callId);

     if (!client) {
      toast.error("Stream Video Client not initialized. Check your setup.");
      setIsCallLoading(false);
      setIsCallInvalid(true);
      return;
    }

    if (!callId) {
        setIsCallLoading(false);
        setIsCallInvalid(true);
        return;
    }

    const loadCall = async () => {
      setIsCallLoading(true);
      setIsCallInvalid(false);
      setCall(undefined);

      try {
        const { calls } = await client.queryCalls({ filter_conditions: { id: callId } });

        if (calls.length > 0) {
          setCall(calls[0]);
        } else {
          setIsCallInvalid(true);
        }
      } catch (error: any) {
        console.error("Error fetching call:", error);
        setIsCallInvalid(true);
        setCall(undefined);
      } finally {
        setIsCallLoading(false);
      }
    };

    loadCall();
  }, [client, id]);

  return { call, isCallLoading, isCallInvalid };
};