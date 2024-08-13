<script setup lang="ts">
import Editor from "./components/editor/Editor.vue";

const PLACEHOLDERS = [
  {
    id: 1,
    name: "address",
    title: "Address",
    description: "Customer Support correspondence address.",
  },
  {
    id: 2,
    name: "assignee",
    title: "Assignee Name",
    description: "Ticket assignee name.",
  },
  {
    id: 3,
    name: "deadline",
    title: "Deadline Time",
    description: "Utmost time to which technician should handle the issue.",
  },
  {
    id: 4,
    name: "department",
    title: "Department Name",
    description: "Department name responsible for servicing this ticket.",
  },
  {
    id: 5,
    name: "caseid",
    title: "Case ID",
    description: "Unique case number used to distinguish tickets.",
  },
  {
    id: 6,
    name: "casename",
    title: "Case Name",
    description: "Name of the ticket provided by the user.",
  },
  {
    id: 7,
    name: "contact",
    title: "Contact E-mail",
    description: "Customer Support contact e-mail address.",
  },
  {
    id: 8,
    name: "customer",
    title: "Customer Name",
    description: "Receipent of your response.",
  },
  {
    id: 9,
    name: "hotline",
    title: "Hotline Number",
    description: "Customer Support Hotline number.",
  },
  {
    id: 10,
    name: "technician",
    title: "Technician Name",
    description: "Technician which will handle this ticket.",
  },
];
</script>

<template>
  <Editor :suggestions="PLACEHOLDERS" />
</template>

<style scoped>

</style>
