import { Skeleton } from "@/components/ui/skeleton";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";

interface FaqSkeletonProps {
  itemsPerPage: number;
  showActionsColumn: boolean;
}

const FaqSkeleton = ({ itemsPerPage, showActionsColumn }: FaqSkeletonProps) => {
  const skeletonIds = [
    'skeleton-1', 'skeleton-2', 'skeleton-3', 'skeleton-4', 'skeleton-5',
    'skeleton-6', 'skeleton-7', 'skeleton-8', 'skeleton-9', 'skeleton-10'
  ];

  return (
    <>
      {Array.from({ length: itemsPerPage }).map((_, index) => (
        <TableRow key={skeletonIds[index]} className="border-white/10">
          <TableCell>
            <Skeleton className="h-4 w-8 bg-white/10" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24 bg-white/10" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24 bg-white/10" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24 bg-white/10" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24 bg-white/10" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24 bg-white/10" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24 bg-white/10" />
          </TableCell>
          {showActionsColumn && (
            <TableCell>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 bg-white/10" />
                <Skeleton className="h-8 w-8 bg-white/10" />
              </div>
            </TableCell>
          )}
        </TableRow>
      ))}
    </>
  );
};

export default FaqSkeleton; 