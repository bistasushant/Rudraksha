import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";

const OrderProduct = () => {
  return (
    <Tabs defaultValue="orders" className="mx-8">
      <TabsList className="bg-white/5 border border-white/10 text-white mb-2">
        <TabsTrigger
          value="orders"
          className="data-[state=active]:bg-sky-700 text-white"
        >
          Recent Orders
        </TabsTrigger>
        <TabsTrigger
          value="products"
          className="data-[state=active]:bg-sky-700 text-white"
        >
          Top Products
        </TabsTrigger>
      </TabsList>
      <TabsContent value="orders">
        <Card className="bg-white/5 border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white font-semibold text-2xl">
              Recent Orders
            </CardTitle>
            <CardDescription className="text-white/70 text-md">
              Latest customer orders from your store
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-white/70 text-md">
                    Order ID
                  </TableHead>
                  <TableHead className="text-white/70 text-md">
                    Customer
                  </TableHead>
                  <TableHead className="text-white/70 text-md">
                    Product
                  </TableHead>
                  <TableHead className="text-white/70 text-md">Date</TableHead>
                  <TableHead className="text-white/70 text-md">
                    Amount
                  </TableHead>
                  <TableHead className="text-white/70 text-md">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white/70 text-md">
                    #ORD-7245
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg" alt="Avatar" />
                        <AvatarFallback className="bg-purple-600">
                          JD
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white/70 text-md">John Doe</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    iPhone 15 Pro
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    Apr 23, 2023
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    Rs 1,299.00
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">
                      Completed
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white/70 text-md">
                    #ORD-7244
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg" alt="Avatar" />
                        <AvatarFallback className="bg-purple-600">
                          AS
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white/70 text-md">Alice Smith</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    MacBook Air M2
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    Apr 22, 2023
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    Rs 1,199.00
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
                      Processing
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white/70 text-md">
                    #ORD-7243
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg" alt="Avatar" />
                        <AvatarFallback className="bg-purple-600">
                          RJ
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white/70 text-md">
                        Robert Johnson
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    AirPods Pro
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    Apr 22, 2023
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    Rs 249.00
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">
                      Completed
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white/70 text-md">
                    #ORD-7242
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg" alt="Avatar" />
                        <AvatarFallback className="bg-purple-600">
                          EW
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white/70 text-md">
                        Emily Wilson
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    iPad Air
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    Apr 21, 2023
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    Rs 599.00
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">
                      Pending
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white/70 text-md">
                    #ORD-7241
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg" alt="Avatar" />
                        <AvatarFallback className="bg-purple-600">
                          MB
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white/70 text-md">
                        Michael Brown
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    Apple Watch Series 8
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    Apr 20, 2023
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    Rs 399.00
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">
                      Completed
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="products">
        <Card className="bg-white/5 border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white font-semibold text-2xl">
              Top Products
            </CardTitle>
            <CardDescription className="text-white/70 text-md">
              Your best-selling products this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-white/70 text-md">
                    Product
                  </TableHead>
                  <TableHead className="text-white/70 text-md">
                    Category
                  </TableHead>
                  <TableHead className="text-white/70 text-md">Price</TableHead>
                  <TableHead className="text-white/70 text-md">Stock</TableHead>
                  <TableHead className="text-white/70 text-md">Sales</TableHead>
                  <TableHead className="text-white/70 text-md">
                    Revenue
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-md overflow-hidden">
                        <Image
                          src="/images/iphone.jpeg"
                          alt="iPhone 15 Pro"
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-white/70 text-md">
                          iPhone 15 Pro
                        </div>
                        <div className="text-xs text-white/70">Apple</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    Smartphones
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    Rs 1,299.00
                  </TableCell>
                  <TableCell className="text-white/70 text-md">124</TableCell>
                  <TableCell className="text-white/70 text-md">87</TableCell>
                  <TableCell className="text-white/70 text-md">
                    Rs 113,013.00
                  </TableCell>
                </TableRow>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-md overflow-hidden">
                        <Image
                          src="/images/iphone.jpeg"
                          alt="MacBook Air M2"
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-white/70 text-md">
                          MacBook Air M2
                        </div>
                        <div className="text-xs text-white/70">Apple</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    Laptops
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    Rs 1,199.00
                  </TableCell>
                  <TableCell className="text-white/70 text-md">56</TableCell>
                  <TableCell className="text-white/70 text-md">62</TableCell>
                  <TableCell className="text-white/70 text-md">
                    Rs 74,338.00
                  </TableCell>
                </TableRow>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-md overflow-hidden">
                        <Image
                          src="/images/iphone.jpeg"
                          alt="AirPods Pro"
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-white/70 text-md">
                          AirPods Pro
                        </div>
                        <div className="text-xs text-white/70">Apple</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/70 text-md">Audio</TableCell>
                  <TableCell className="text-white/70 text-md">
                    Rs 249.00
                  </TableCell>
                  <TableCell className="text-white/70 text-md">230</TableCell>
                  <TableCell className="text-white/70 text-md">145</TableCell>
                  <TableCell className="text-white/70 text-md">
                    Rs 36,105.00
                  </TableCell>
                </TableRow>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-md overflow-hidden">
                        <Image
                          src="/images/iphone.jpeg"
                          alt="iPad Air"
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-white/70 text-md">
                          iPad Air
                        </div>
                        <div className="text-xs text-white/70">Apple</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    Tablets
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    Rs 599.00
                  </TableCell>
                  <TableCell className="text-white/70 text-md">89</TableCell>
                  <TableCell className="text-white/70 text-md">78</TableCell>
                  <TableCell className="text-white/70 text-md">
                    Rs 46,722.00
                  </TableCell>
                </TableRow>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-md overflow-hidden">
                        <Image
                          src="/images/iphone.jpeg"
                          alt="Apple Watch Series 8"
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium text-white/70 text-md">
                          Apple Watch Series 8
                        </div>
                        <div className="text-xs text-white/70">Apple</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    Wearables
                  </TableCell>
                  <TableCell className="text-white/70 text-md">
                    Rs 399.00
                  </TableCell>
                  <TableCell className="text-white/70 text-md">112</TableCell>
                  <TableCell className="text-white/70 text-md">93</TableCell>
                  <TableCell className="text-white/70 text-md">
                    Rs 37,107.00
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
      <div className="mb-8" />
    </Tabs>
  );
};

export default OrderProduct;
