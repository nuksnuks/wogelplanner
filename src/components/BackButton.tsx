import { useRouter } from 'next/router';
import { FiArrowLeft } from 'react-icons/fi';

export default function BackButton() {
  const router = useRouter();
  return (
    <button type="button" onClick={() => router.back()} >
      <FiArrowLeft aria-hidden="true" className="inlineIcon" /> Back
    </button>
  );
}
