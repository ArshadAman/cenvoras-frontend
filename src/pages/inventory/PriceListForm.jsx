import React from "react";
import { Formik, Form, Field, FieldArray, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPriceList, getPriceList, updatePriceList, getProducts } from "../../api/inventory";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Layout from "../../components/Layout";
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const priceListSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  party_category: Yup.string().required("Category is required"),
  is_active: Yup.boolean(),
  items: Yup.array().of(
    Yup.object().shape({
      product: Yup.string().required("Product is required"),
      price: Yup.number().required("Price is required").min(0),
      min_qty: Yup.number().min(1, "Min Qty must be at least 1"),
    })
  ),
});

export default function PriceListForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts(),
  });

  const { data: priceList, isLoading } = useQuery({
    queryKey: ["priceList", id],
    queryFn: () => getPriceList(id),
    enabled: isEdit,
  });

  const mutation = useMutation({
    mutationFn: (values) => isEdit ? updatePriceList(id, values) : createPriceList(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceLists"] });
      toast.success(isEdit ? "Price List updated!" : "Price List created!");
      navigate("/inventory/price-lists");
    },
    onError: (err) => toast.error(err.message || "Failed to save price list"),
  });

  if (isEdit && isLoading) return <Layout><div className="p-10 text-white">Loading...</div></Layout>;

  const initialValues = {
    name: priceList?.name || "",
    party_category: priceList?.party_category || "",
    is_active: priceList?.is_active ?? true,
    items: priceList?.items?.map(item => ({
        product: item.product,
        price: item.price,
        min_qty: item.min_qty
    })) || [{ product: "", price: "", min_qty: 1 }],
  };

  const inputClass = "bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-white text-sm w-full focus:ring-1 focus:ring-green-500 outline-none";

  return (
    <Layout>
      <div className="p-6 md:p-10 animate-fade-up max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
            <ArrowLeftIcon className="w-4 h-4 mr-2" /> Back to List
        </button>

        <div className="bento-card relative overflow-hidden">
            <h1 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">
                {isEdit ? "Edit Price List" : "New Price List"}
            </h1>

            <Formik
                initialValues={initialValues}
                validationSchema={priceListSchema}
                onSubmit={(values) => mutation.mutate(values)}
                enableReinitialize
            >
                {({ values }) => (
                    <Form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Name</label>
                                <Field name="name" className={inputClass} placeholder="e.g. Wholesale 2024" />
                                <ErrorMessage name="name" component="div" className="text-red-400 text-xs mt-1" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Party Category</label>
                                <Field as="select" name="party_category" className={inputClass}>
                                    <option value="">Select Category</option>
                                    <option value="retailer">Retailer</option>
                                    <option value="wholesaler">Wholesaler</option>
                                    <option value="distributor">Distributor</option>
                                    <option value="consumer">End Consumer</option>
                                </Field>
                                <ErrorMessage name="party_category" component="div" className="text-red-400 text-xs mt-1" />
                            </div>
                            <div className="flex items-center">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <Field type="checkbox" name="is_active" className="rounded bg-white/10 border-white/20 text-green-500 focus:ring-green-500" />
                                    <span className="text-white text-sm">Active</span>
                                </label>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-6">
                            <h3 className="text-lg font-bold text-white mb-4">Pricing Rules</h3>
                            <FieldArray name="items">
                                {({ remove, push }) => (
                                    <div className="space-y-3">
                                        {values.items.map((item, index) => (
                                            <div key={index} className="flex gap-3 items-start bg-white/5 p-3 rounded-lg border border-white/5">
                                                <div className="flex-1">
                                                    <Field as="select" name={`items.${index}.product`} className={inputClass}>
                                                        <option value="">Select Product</option>
                                                        {products?.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </Field>
                                                    <ErrorMessage name={`items.${index}.product`} component="div" className="text-red-400 text-xs" />
                                                </div>
                                                <div className="w-24">
                                                    <Field type="number" name={`items.${index}.min_qty`} className={inputClass} placeholder="Min Qty" />
                                                </div>
                                                <div className="w-32">
                                                    <Field type="number" name={`items.${index}.price`} className={inputClass} placeholder="Price (₹)" />
                                                    <ErrorMessage name={`items.${index}.price`} component="div" className="text-red-400 text-xs" />
                                                </div>
                                                <button type="button" onClick={() => remove(index)} className="p-2 text-red-400 hover:text-red-300">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => push({ product: "", price: "", min_qty: 1 })}
                                            className="mt-2 text-sm text-green-400 hover:text-green-300 flex items-center gap-1"
                                        >
                                            <PlusIcon className="w-4 h-4" /> Add Item
                                        </button>
                                    </div>
                                )}
                            </FieldArray>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-white/10">
                            <button
                                type="submit"
                                disabled={mutation.isPending}
                                className="btn-primary shadow-lg shadow-green-500/20"
                            >
                                {mutation.isPending ? "Saving..." : "Save Price List"}
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
      </div>
    </Layout>
  );
}
