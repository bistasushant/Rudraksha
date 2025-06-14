import { TableCell, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface SizeListSkeletonProps {
  itemsPerPage: number;
  showActionsColumn: boolean;
}

const SizeListSkeleton = ({ itemsPerPage, showActionsColumn }: SizeListSkeletonProps) => {
  return (
    <>
      {Array.from({ length: itemsPerPage }).map((_, index) => (
        <TableRow key={`skeleton-${index}`} className="border-white/10">
          <TableCell>
            <Skeleton className="h-4 w-12 bg-white/10" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-12 bg-white/10" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-12 bg-white/10" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-12 bg-white/10" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-12 bg-white/10" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-12 bg-white/10" />
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

export default SizeListSkeleton; 