import { Suspense } from "react"

import CompleteProfileWizard from "./components/complete-profile-wizard"

const CompleteProfile = () => {
  return (
    <Suspense fallback={null}>
      <CompleteProfileWizard />
    </Suspense>
  )
}

export default CompleteProfile
