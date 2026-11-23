import { Page, Empty, Loading } from '../components/ui'
import { PhotoGrid } from '../components/photos'
import { byId, useBeds, useCrops, usePhotos, usePlantings, useVarieties } from '../data/repo'
import { plantingName } from '../lib/labels'

export default function AllPhotos() {
  const photos = usePhotos()
  const plantings = byId(usePlantings())
  const beds = byId(useBeds(true))
  const crops = byId(useCrops())
  const varieties = byId(useVarieties())
  return (
    <Page title="All photos" back>
      {!photos ? (
        <Loading />
      ) : photos.length === 0 ? (
        <Empty>No photos yet.</Empty>
      ) : (
        <PhotoGrid
          photos={photos}
          labels={(ph) => {
            const p = ph.plantingId ? plantings.get(ph.plantingId) : undefined
            if (p) return plantingName(p, crops, varieties)
            return ph.bedId ? beds.get(ph.bedId)?.name : undefined
          }}
        />
      )}
    </Page>
  )
}
