import { Route, Routes } from 'react-router-dom'
import TabBar from './components/TabBar'
import Today from './screens/Today'
import Beds from './screens/Beds'
import BedDetail from './screens/BedDetail'
import BedForm from './screens/BedForm'
import PlantingDetail from './screens/PlantingDetail'
import PlantingForm from './screens/PlantingForm'
import Seedlings from './screens/Seedlings'
import AddPhoto from './screens/AddPhoto'
import Crops from './screens/Crops'
import CropDetail from './screens/CropDetail'
import More from './screens/More'
import Settings from './screens/Settings'
import AllPhotos from './screens/AllPhotos'
import Plantings from './screens/Plantings'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/beds" element={<Beds />} />
        <Route path="/beds/new" element={<BedForm />} />
        <Route path="/beds/:id" element={<BedDetail />} />
        <Route path="/beds/:id/edit" element={<BedForm />} />
        <Route path="/plantings" element={<Plantings />} />
        <Route path="/plantings/new" element={<PlantingForm />} />
        <Route path="/plantings/:id" element={<PlantingDetail />} />
        <Route path="/plantings/:id/edit" element={<PlantingForm />} />
        <Route path="/seedlings" element={<Seedlings />} />
        <Route path="/photo" element={<AddPhoto />} />
        <Route path="/photos" element={<AllPhotos />} />
        <Route path="/crops" element={<Crops />} />
        <Route path="/crops/:id" element={<CropDetail />} />
        <Route path="/more" element={<More />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Today />} />
      </Routes>
      <TabBar />
    </>
  )
}
