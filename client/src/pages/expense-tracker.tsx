import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Wallet, Plus, Search, Trash2, DollarSign, TrendingUp, Receipt, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertExpenseSchema, type Expense, type InsertExpense } from "@shared/schema";

const categoryIcons: Record<string, string> = {
  food: "🍽️",
  transport: "🚗",
  shopping: "🛒",
  entertainment: "🎬",
  utilities: "💡",
  healthcare: "🏥",
  education: "📚",
  others: "📋"
};

const categoryLabels: Record<string, string> = {
  food: "Food & Dining",
  transport: "Transportation", 
  shopping: "Shopping",
  entertainment: "Entertainment",
  utilities: "Utilities",
  healthcare: "Healthcare",
  education: "Education",
  others: "Others"
};

const categoryGradients: Record<string, string> = {
  food: "from-orange-500 to-red-600",
  transport: "from-blue-500 to-indigo-600",
  shopping: "from-green-500 to-emerald-600",
  entertainment: "from-purple-500 to-pink-600",
  utilities: "from-yellow-500 to-orange-600",
  healthcare: "from-red-500 to-pink-600",
  education: "from-indigo-500 to-purple-600",
  others: "from-gray-500 to-gray-600"
};

function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num).replace('₹', '₹');
}

export default function ExpenseTracker() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const { toast } = useToast();

  const form = useForm<InsertExpense>({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      amount: 0,
      description: "",
      category: "others" as const
    }
  });

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", filterCategory !== "all" ? `?category=${filterCategory}` : ""],
    refetchInterval: false,
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: InsertExpense) => {
      const response = await apiRequest("POST", "/api/expenses", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      form.reset();
      toast({
        title: "Success",
        description: "Expense added successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add expense",
        variant: "destructive",
      });
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Success", 
        description: "Expense deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete expense",
        variant: "destructive",
      });
    }
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "all" || expense.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, filterCategory]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  }, [filteredExpenses]);

  const monthlyExpenses = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return filteredExpenses
      .filter(expense => {
        const expenseDate = new Date(expense.createdAt);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  }, [filteredExpenses]);

  const onSubmit = (data: InsertExpense) => {
    createExpenseMutation.mutate(data);
  };

  const handleDeleteExpense = (id: number) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      deleteExpenseMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <header className="backdrop-blur-sm bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Wallet className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Expense Tracker
                </h1>
                <p className="text-gray-400 text-sm">Welcome back, Siddarth Dinesh</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(), "MMMM yyyy")}</span>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">SD</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Expense Form */}
          <div className="lg:col-span-1">
            <Card className="backdrop-blur-xl bg-white/10 border-white/20">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center text-white">
                  <Plus className="text-indigo-400 mr-3" />
                  Add New Expense
                </h2>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-8 bg-slate-800/50 border-white/20 text-white placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Description</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="What did you spend on?"
                              className="bg-slate-800/50 border-white/20 text-white placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-slate-800/50 border-white/20 text-white focus:ring-indigo-500 focus:border-indigo-500">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-slate-800 border-white/20">
                              {Object.entries(categoryLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key} className="text-white hover:bg-slate-700">
                                  {categoryIcons[key]} {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit"
                      disabled={createExpenseMutation.isPending}
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {createExpenseMutation.isPending ? "Adding..." : "Add Expense"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Expense List and Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="backdrop-blur-xl bg-white/10 border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Total Expenses</p>
                      <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalExpenses)}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <DollarSign className="text-white h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/10 border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">This Month</p>
                      <p className="text-2xl font-bold text-white mt-1">{formatCurrency(monthlyExpenses)}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                      <TrendingUp className="text-white h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/10 border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">Transactions</p>
                      <p className="text-2xl font-bold text-white mt-1">{filteredExpenses.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Receipt className="text-white h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter and Search */}
            <Card className="backdrop-blur-xl bg-white/10 border-white/20">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <h2 className="text-xl font-semibold flex items-center text-white">
                    <Receipt className="text-emerald-400 mr-3" />
                    Recent Expenses
                  </h2>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search expenses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-800/50 border-white/20 text-white placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    </div>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="bg-slate-800/50 border-white/20 text-white focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-auto">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/20">
                        <SelectItem value="all" className="text-white hover:bg-slate-700">All Categories</SelectItem>
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key} className="text-white hover:bg-slate-700">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expense List */}
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 overflow-hidden">
              {isLoading ? (
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Receipt className="text-white text-xl" />
                  </div>
                  <p className="text-white font-medium">Loading expenses...</p>
                </CardContent>
              ) : filteredExpenses.length === 0 ? (
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Receipt className="text-gray-400 text-xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">No expenses yet</h3>
                  <p className="text-gray-500">Start by adding your first expense using the form on the left.</p>
                </CardContent>
              ) : (
                <div className="divide-y divide-white/10">
                  {filteredExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="p-6 hover:bg-white/5 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${categoryGradients[expense.category]} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-xl">{categoryIcons[expense.category]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-white truncate">
                              {expense.description}
                            </h3>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-400">{categoryLabels[expense.category]}</span>
                              <span className="text-sm text-gray-500">
                                {format(new Date(expense.createdAt), "MMM dd, yyyy")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-xl font-bold text-white">{formatCurrency(expense.amount)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(expense.id)}
                            disabled={deleteExpenseMutation.isPending}
                            className="opacity-0 group-hover:opacity-100 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all duration-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
