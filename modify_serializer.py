import re

with open('/Users/arshadaman/Cenvoras/cenvoras/billing/serializers.py', 'r') as f:
    text = f.read()

# Add round_off to fields
text = re.sub(
    r"total_amount = serializers.DecimalField\(max_digits=12, decimal_places=2, required=False\)",
    r"total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)\n    round_off = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, default=0)",
    text
)

text = re.sub(
    r"'total_amount', 'amount_paid', 'payment_status'",
    r"'total_amount', 'amount_paid', 'payment_status', 'round_off'",
    text
)

# Update create method recalculation
text = re.sub(
    r"recalculated_total = sum\(\(item\.amount for item in sales_invoice\.items\.all\(\)\), Decimal\('0'\)\)\n            sales_invoice\.total_amount = recalculated_total",
    r"round_off = validated_data.get('round_off', Decimal('0.00'))\n            recalculated_total = sum((item.amount for item in sales_invoice.items.all()), Decimal('0')) + Decimal(str(round_off))\n            sales_invoice.total_amount = recalculated_total\n            sales_invoice.round_off = round_off",
    text
)

text = re.sub(
    r"sales_invoice\.save\(update_fields=\['total_amount', 'amount_paid', 'payment_status'\]\)",
    r"sales_invoice.save(update_fields=['total_amount', 'amount_paid', 'payment_status', 'round_off'])",
    text
)

# Update update method recalculation
text = re.sub(
    r"recalculated_total = sum\(\(item\.amount for item in instance\.items\.all\(\)\), Decimal\('0'\)\)\n            instance\.total_amount = recalculated_total",
    r"round_off = validated_data.get('round_off', instance.round_off)\n            recalculated_total = sum((item.amount for item in instance.items.all()), Decimal('0')) + Decimal(str(round_off))\n            instance.total_amount = recalculated_total\n            instance.round_off = round_off",
    text
)

text = re.sub(
    r"instance\.save\(update_fields=\['total_amount', 'amount_paid', 'payment_status'\]\)",
    r"instance.save(update_fields=['total_amount', 'amount_paid', 'payment_status', 'round_off'])",
    text
)


with open('/Users/arshadaman/Cenvoras/cenvoras/billing/serializers.py', 'w') as f:
    f.write(text)

